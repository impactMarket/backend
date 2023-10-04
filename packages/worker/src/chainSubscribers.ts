import { BigNumber } from 'bignumber.js';
import { Op, Transaction } from 'sequelize';
import { config, contracts, database, interfaces, services, subgraph, utils } from '@impactmarket/core';
import { ethers } from 'ethers';
import { getAddress } from '@ethersproject/address';

const { hasSubgraphSyncedToBlock } = subgraph.queries.beneficiary;

class ChainSubscribers {
    provider: ethers.providers.JsonRpcProvider;
    providerFallback: ethers.providers.JsonRpcProvider;
    ifaceERC20: ethers.utils.Interface;
    ifaceCommunityAdmin: ethers.utils.Interface;
    ifaceCommunity: ethers.utils.Interface;
    ifaceMicrocredit: ethers.utils.Interface;
    filterTopics: string[][];
    communities: Map<string, number>;
    microCreditService: services.MicroCredit.Create;
    assetsAddress: { address: string; asset: string }[];

    constructor(
        jsonRpcProvider: ethers.providers.JsonRpcProvider,
        jsonRpcProviderFallback: ethers.providers.JsonRpcProvider,
        communities: Map<string, number>
    ) {
        this.provider = jsonRpcProvider;
        this.providerFallback = jsonRpcProviderFallback;
        this.ifaceERC20 = new ethers.utils.Interface(contracts.ERC20ABI);
        this.ifaceCommunityAdmin = new ethers.utils.Interface(contracts.CommunityAdminABI);
        this.ifaceCommunity = new ethers.utils.Interface(contracts.CommunityABI);
        this.ifaceMicrocredit = new ethers.utils.Interface(contracts.MicrocreditABI);
        this.communities = communities;
        this.microCreditService = new services.MicroCredit.Create();
        this.filterTopics = [
            [
                ethers.utils.id(
                    'CommunityAdded(address,address[],uint256,uint256,uint256,uint256,uint256,uint256,uint256)'
                ),
                ethers.utils.id('CommunityRemoved(address)'),
                ethers.utils.id('BeneficiaryAdded(address,address)'),
                ethers.utils.id('BeneficiaryRemoved(address,address)'),
                ethers.utils.id('LoanAdded(address,uint256,uint256,uint256,uint256,uint256)'),
                ethers.utils.id('ManagerChanged(address,address)'),
                ethers.utils.id('Transfer(address,address,uint256)')
            ]
        ];
        this.assetsAddress = JSON.parse(config.assetsAddress);
        this.recover();
    }

    stop() {
        this.provider.removeAllListeners();
        services.app.ImMetadataService.setRecoverBlockUsingLastBlock();
    }

    recover() {
        // we start the listener alongside with the recover system
        // so we know we don't lose events.
        this._runRecoveryTxs(this.provider, this.providerFallback)
            .then(() => {
                services.app.ImMetadataService.removeRecoverBlock();
                this._setupListener(this.provider);
            })
            .catch(error => utils.Logger.error('Failed to recover past events!', error));
    }

    async _runRecoveryTxs(
        provider: ethers.providers.JsonRpcProvider,
        fallbackProvider: ethers.providers.JsonRpcProvider
    ) {
        utils.Logger.info('Recovering past events...');
        let startFromBlock: number;
        const lastBlockCached = await database.redisClient.get('lastBlock');
        if (!lastBlockCached) {
            startFromBlock = await services.app.ImMetadataService.getRecoverBlock();
        } else {
            startFromBlock = parseInt(lastBlockCached, 10);
        }

        let rawLogs: ethers.providers.Log[] = [];

        try {
            rawLogs = await this._getLogs(startFromBlock, provider);
            utils.Logger.info('Got logs from main provider!');
        } catch (error) {
            utils.Logger.error('Failed to get logs from main provider!', error);
            rawLogs = await this._getLogs(startFromBlock, fallbackProvider);
            utils.Logger.info('Got logs from fallback provider!');
        }

        const logs = rawLogs.sort((a, b) => {
            if (a.blockNumber > b.blockNumber) {
                return 1;
            }
            if (a.blockNumber < b.blockNumber) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });

        try {
            await database.sequelize.transaction(async t => {
                const transactions: Promise<void>[] = [];
                for (let x = 0; x < logs.length; x++) {
                    // verify if cusd or community and do things
                    transactions.push(this._filterAndProcessEvent(logs[x], t));
                }
                await Promise.all(transactions);
                database.redisClient.set('lastBlock', logs[logs.length - 1].blockNumber);
                services.app.ImMetadataService.setLastBlock(logs[logs.length - 1].blockNumber);
            });
        } catch (error) {
            // TODO: add error handling
        }
        utils.Logger.info('Past events recovered successfully!');
    }

    async _getLogs(startFromBlock: number, provider: ethers.providers.JsonRpcProvider) {
        return provider.getLogs({
            fromBlock: startFromBlock,
            toBlock: 'latest',
            topics: this.filterTopics
        });
    }

    _setupListener(provider: ethers.providers.JsonRpcProvider) {
        utils.Logger.info('Starting subscribers...');
        const filter = {
            topics: this.filterTopics
        };

        database.redisClient.set('blockCount', 0);
        const savedLogs = new Map<number, ethers.providers.Log[]>();

        // to reduce commits to the database, we will save the last block
        // and only process all logs once we get a new block
        provider.on(filter, async (log: ethers.providers.Log) => {
            utils.Logger.info('Receiving new event');
            // get last saved block and current block
            const lastBlock = parseInt((await database.redisClient.get('lastBlock')) ?? '0', 10);
            const currentBlock = log.blockNumber;
            if (currentBlock - lastBlock > 0) {
                database.redisClient.set('lastBlock', currentBlock);
                // process all last block logs
                const lastBlockLogs = savedLogs.get(lastBlock) ?? [log];
                try {
                    utils.Logger.info(`Processing logs (${lastBlock}) (${lastBlockLogs.length} txs)...`);
                    const before = Date.now();
                    await database.sequelize.transaction(async transaction => {
                        const transactions: Promise<void>[] = [];
                        for (let x = 0; x < lastBlockLogs.length; x++) {
                            transactions.push(this._filterAndProcessEvent(lastBlockLogs[x], transaction));
                        }
                        await Promise.all(transactions);
                        // clean saved logs
                        savedLogs.delete(lastBlock);
                        // update block count
                        database.redisClient.set('lastBlock', log.blockNumber);
                        const blockCount = await database.redisClient.get('blockCount');

                        if (!!blockCount && blockCount > '16560') {
                            services.app.ImMetadataService.setLastBlock(log.blockNumber);
                            database.redisClient.set('blockCount', 0);
                        } else {
                            database.redisClient.incr('blockCount');
                        }
                    });
                    utils.Logger.info(`Logs processed! Elapsed: ${Date.now() - before}ms`);
                } catch (error) {
                    utils.Logger.error('Failed to process logs!', error);
                }
            } else {
                // save current log
                const currentLogs = savedLogs.get(currentBlock) ?? [];
                currentLogs.push(log);
                savedLogs.set(currentBlock, currentLogs);
            }
        });
    }

    // this method will retry every 2 second to find out if the subgraph is synced
    // it should only return when it is, until there, it will keep the event loop blocked
    async _waitForSubgraphToIndex(log: ethers.providers.Log) {
        return new Promise(resolve => {
            async function check() {
                const isSynced = await hasSubgraphSyncedToBlock(log.blockNumber);
                console.log({ isSynced });
                if (isSynced) {
                    resolve({});
                } else {
                    setTimeout(check, 2000);
                }
            }
            check();
        });
    }

    async _filterAndProcessEvent(log: ethers.providers.Log, transaction: Transaction): Promise<void> {
        const before = Date.now();
        if (log.address === config.communityAdminAddress) {
            utils.Logger.info('Receiving event from CommunityAdmin');
            await this._processCommunityAdminEvents(log, transaction);
            utils.Logger.info(`Event processed! Elapsed: ${Date.now() - before}ms`);
        } else if (this.communities.get(log.address)) {
            utils.Logger.info('Receiving event from Community');
            await this._processCommunityEvents(log, transaction);
            utils.Logger.info(`Event processed! Elapsed: ${Date.now() - before}ms`);
        } else if (log.address === config.microcreditContractAddress) {
            utils.Logger.info('Receiving event from Microcredit');
            await this._processMicrocreditEvents(log, transaction);
            utils.Logger.info(`Event processed! Elapsed: ${Date.now() - before}ms`);
        } else if (this.assetsAddress.find(el => el.address === log.address)) {
            utils.Logger.info('Receiving event from Transfer (cUSD)');
            await this._processTransfer(log);
            utils.Logger.info(`Event processed! Elapsed: ${Date.now() - before}ms`);
        }
    }

    async _processTransfer(log: ethers.providers.Log): Promise<void> {
        const parsedLog = this.ifaceERC20.parseLog(log);
        const address = parsedLog.args[1];
        const amount = new BigNumber(parseFloat(parsedLog.args[2])).dividedBy(10 ** config.cUSDDecimal).toNumber();
        const asset = this.assetsAddress.find(el => el.address === log.address)!.asset;
        const user = await database.models.appUser.findOne({
            where: {
                address,
                walletPNT: {
                    [Op.not]: null
                }
            }
        });

        // send push notification
        if (user)
            utils.pushNotification.sendNotification(
                [user],
                interfaces.app.appNotification.NotificationType.TRANSACTION_RECEIVED,
                true,
                true,
                { path: log.transactionHash },
                undefined,
                {
                    amount,
                    asset
                }
            );
    }

    async _processCommunityAdminEvents(log: ethers.providers.Log, transaction: Transaction): Promise<void> {
        try {
            const parsedLog = this.ifaceCommunityAdmin.parseLog(log);

            if (parsedLog.name === 'CommunityRemoved') {
                utils.Logger.info('Remove Community event');

                const communityAddress = parsedLog.args[0];
                const community = await database.models.community.findOne({
                    attributes: ['id'],
                    where: { contractAddress: communityAddress }
                });

                if (!community || !community.id) {
                    utils.Logger.error(`Community with address ${communityAddress} wasn't found at "CommunityRemoved"`);
                } else {
                    await database.models.community.update(
                        {
                            status: 'removed',
                            deletedAt: new Date()
                        },
                        {
                            where: { contractAddress: communityAddress },
                            transaction
                        }
                    );
                    this.communities.delete(communityAddress);
                }
            } else if (parsedLog.name === 'CommunityAdded') {
                utils.Logger.info('Add Community event');

                const communityAddress = parsedLog.args[0];
                const managerAddress = parsedLog.args[1];

                const [affectedCount, affectedRows] = await database.models.community.update(
                    {
                        contractAddress: communityAddress,
                        status: 'valid'
                    },
                    {
                        where: {
                            requestByAddress: managerAddress[0]
                        },
                        returning: true,
                        transaction
                    }
                );
                if (affectedCount === 0) {
                    utils.Logger.error(`Community with address ${communityAddress} wasn't updated at "CommunityAdded"`);
                } else {
                    this.communities.set(communityAddress, affectedRows[0].id);
                    const user = await database.models.appUser.findOne({
                        attributes: ['id', 'language', 'walletPNT', 'appPNT'],
                        where: {
                            address: getAddress(managerAddress[0])
                        }
                    });
                    if (user) {
                        await utils.pushNotification.sendNotification(
                            [user.toJSON()],
                            interfaces.app.appNotification.NotificationType.COMMUNITY_CREATED,
                            true,
                            true,
                            {
                                path: `${interfaces.app.appNotification.NotificationParamsPath.COMMUNITY}${affectedRows[0].id}`
                            },
                            transaction
                        );
                    }
                }
            }
        } catch (error) {
            utils.Logger.error('Failed to process Community Admin Events:', error);
        }
    }

    async _processCommunityEvents(log: ethers.providers.Log, transaction: Transaction): Promise<void> {
        try {
            const parsedLog = this.ifaceCommunity.parseLog(log);

            if (parsedLog.name === 'BeneficiaryAdded') {
                utils.Logger.info('Add Beneficiary event');

                const communityAddress = log.address;
                const community = this.communities.get(communityAddress);
                const userAddress = parsedLog.args[1];

                if (community) {
                    this._waitForSubgraphToIndex(log).then(() => {
                        utils.cache.cleanBeneficiaryCache(community);
                        utils.cache.cleanUserRolesCache(userAddress);
                    });
                }

                const user = await database.models.appUser.findOne({
                    attributes: ['id', 'language', 'walletPNT', 'appPNT'],
                    where: {
                        address: getAddress(userAddress)
                    }
                });
                if (user && community) {
                    await utils.pushNotification.sendNotification(
                        [user.toJSON()],
                        interfaces.app.appNotification.NotificationType.BENEFICIARY_ADDED,
                        true,
                        true,
                        {
                            path: `${interfaces.app.appNotification.NotificationParamsPath.COMMUNITY}${community}`
                        },
                        transaction
                    );
                }
            } else if (parsedLog.name === 'BeneficiaryRemoved') {
                utils.Logger.info('Remove Beneficiary event');

                const communityAddress = log.address;
                const community = this.communities.get(communityAddress);
                const userAddress = parsedLog.args[1];

                if (community) {
                    this._waitForSubgraphToIndex(log).then(() => {
                        utils.cache.cleanBeneficiaryCache(community);
                        utils.cache.cleanUserRolesCache(userAddress);
                    });
                }
            }
        } catch (error) {
            utils.Logger.error('Failed to process Community Events:', error);
        }
    }

    async _processMicrocreditEvents(log: ethers.providers.Log, transaction: Transaction): Promise<void> {
        try {
            const parsedLog = this.ifaceMicrocredit.parseLog(log);
            const userAddress = parsedLog.args[0];

            if (parsedLog.name === 'LoanAdded') {
                utils.Logger.info('Add Loan event');

                const [user, transactionsReceipt] = await Promise.all([
                    database.models.appUser.findOne({
                        attributes: ['id', 'language', 'walletPNT', 'appPNT'],
                        where: {
                            address: getAddress(userAddress)
                        }
                    }),
                    this.provider.getTransaction(log.transactionHash)
                ]);
                if (user) {
                    const [[borrower, created], loanManagerUser] = await Promise.all([
                        database.models.microCreditBorrowers.findOrCreate({
                            where: {
                                userId: user.id
                            },
                            defaults: {
                                userId: user.id,
                                manager: transactionsReceipt.from,
                                performance: 100
                            },
                            transaction
                        }),
                        database.models.appUser.findOne({
                            attributes: ['id'],
                            where: {
                                address: getAddress(transactionsReceipt.from)
                            }
                        }),
                        this.microCreditService.updateApplication(
                            [userAddress],
                            [interfaces.microcredit.microCreditApplications.MicroCreditApplicationStatus.APPROVED],
                            transaction
                        )
                    ]);
                    if (!created) {
                        this._waitForSubgraphToIndex(log).then(() => {
                            utils.cache.cleanUserRolesCache(userAddress);
                            if (loanManagerUser) {
                                utils.cache.cleanMicroCreditBorrowersCache(loanManagerUser.id);
                                utils.cache.cleanMicroCreditApplicationsCache(loanManagerUser.id);
                            }
                        });
                        await borrower.update(
                            {
                                manager: transactionsReceipt.from,
                                performance: 100
                            },
                            { transaction }
                        );
                    }
                }
            } else if (parsedLog.name === 'ManagerChanged') {
                utils.Logger.info('ManagerChanged event');

                const user = await database.models.appUser.findOne({
                    attributes: ['id'],
                    where: {
                        address: getAddress(userAddress)
                    }
                });
                if (user) {
                    await database.models.microCreditBorrowers.update(
                        {
                            manager: parsedLog.args[1]
                        },
                        {
                            where: {
                                userId: user.id
                            },
                            transaction
                        }
                    );
                }
            }
        } catch (error) {
            utils.Logger.error('Failed to process Microcredit Events:', error);
        }
    }
}

export { ChainSubscribers };
