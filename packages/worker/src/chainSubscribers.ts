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
                ethers.utils.id('LoanClaimed(address,uint256)'),
                // below to be removed once smart contracts are upgraded
                ethers.utils.id('LoanAdded(address,uint256,uint256,uint256,uint256,uint256)'),
                ethers.utils.id('LoanAdded(address,address,uint256,uint256,uint256,uint256,uint256)'),
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
        // wait for the recover to finish before starting the listener
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
        let isLastBlock = false;

        // get logs in batches of up to a 100 blocks, defined in `_getLogs`
        do {
            try {
                const r = await this._getLogs(startFromBlock, provider);
                rawLogs = r.logs;
                startFromBlock = r.lastBlock;
                isLastBlock = r.isLastBlock;
                utils.Logger.info('Got logs from main provider!');
            } catch (error) {
                utils.Logger.error('Failed to get logs from main provider!', error);
                const r = await this._getLogs(startFromBlock, fallbackProvider);
                rawLogs = r.logs;
                startFromBlock = r.lastBlock;
                isLastBlock = r.isLastBlock;
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
                        transactions.push(this._filterAndProcessEvent(logs[x], t));
                    }
                    await Promise.all(transactions);
                    database.redisClient.set('lastBlock', logs[logs.length - 1].blockNumber);
                    services.app.ImMetadataService.setLastBlock(logs[logs.length - 1].blockNumber);
                });
            } catch (error) {
                // TODO: add error handling
            }
        } while (!isLastBlock);
        utils.Logger.info('Past events recovered successfully!');
    }

    /**
     * Get logs from a provider up to 100 blocks
     * @param startFromBlock Block number to start from
     * @param provider JSON RPC provider
     * @returns Object with logs, lastBlock and isLastBlock
     */
    async _getLogs(startFromBlock: number, provider: ethers.providers.JsonRpcProvider) {
        const lastBlock = await provider.getBlockNumber();
        const toBlock = lastBlock - startFromBlock > 100 ? startFromBlock + 100 : lastBlock;
        const logs = await provider.getLogs({
            fromBlock: startFromBlock,
            toBlock,
            topics: this.filterTopics
        });
        return {
            logs,
            lastBlock,
            isLastBlock: lastBlock === toBlock
        };
    }

    async _setupListener(provider: ethers.providers.JsonRpcProvider) {
        utils.Logger.info('Starting subscribers...');
        const filter = { topics: this.filterTopics };
        const savedLogs = new Map<number, ethers.providers.Log[]>();

        // to reduce commits to the database, we will save the last block
        // and only process all logs once we get a new block
        const currentBlock = await provider.getBlockNumber();
        let memoryBlock = currentBlock;
        let lastBlockWithActivity = 0;
        let lastBlockShortStorage = parseInt((await database.redisClient.get('lastBlock')) ?? '0', 10);
        let lastBlockLongStorage = await services.app.ImMetadataService.getLastBlock();

        // listen to events and register them in memory
        provider.on(filter, (log: ethers.providers.Log) => {
            memoryBlock = log.blockNumber;
            const hasValidEvent = this._preFilterAndProcessEvent(log);
            if (!hasValidEvent) {
                return;
            }

            // save current log
            const currentLogs = savedLogs.get(log.blockNumber) ?? [];
            currentLogs.push(log);
            savedLogs.set(log.blockNumber, currentLogs);

            if (lastBlockWithActivity === 0 || lastBlockWithActivity < log.blockNumber) {
                lastBlockWithActivity = log.blockNumber;
            }
        });

        // process events from previous block when a new block is created
        provider.on('block', async (blockNumber: number) => {
            if (
                blockNumber > lastBlockWithActivity &&
                memoryBlock >= lastBlockWithActivity &&
                lastBlockWithActivity !== 0
            ) {
                // process all last block logs
                const lastBlockLogs = savedLogs.get(lastBlockWithActivity) ?? [];
                try {
                    utils.Logger.info(`Processing logs (${lastBlockWithActivity}) (${lastBlockLogs.length} txs)...`);
                    const before = Date.now();

                    await database.sequelize.transaction(async transaction => {
                        const transactions: Promise<void>[] = [];
                        for (let x = 0; x < lastBlockLogs.length; x++) {
                            transactions.push(this._filterAndProcessEvent(lastBlockLogs[x], transaction));
                        }
                        await Promise.all(transactions);
                    });
                    // clean saved logs from processed block
                    savedLogs.delete(lastBlockWithActivity);
                    // update block count, every 23 hours to database and every 1 hour to cache
                    if (blockNumber - (lastBlockLongStorage || 0) > 16560) {
                        services.app.ImMetadataService.setLastBlock(blockNumber);
                        lastBlockLongStorage = blockNumber;
                    } else if (blockNumber - lastBlockShortStorage > 720) {
                        database.redisClient.set('lastBlock', blockNumber);
                        lastBlockShortStorage = blockNumber;
                    }
                    utils.Logger.info(`Logs processed! Elapsed: ${Date.now() - before}ms`);
                } catch (error) {
                    utils.Logger.error('Failed to process logs!', error);
                }
                lastBlockWithActivity = blockNumber;
            }
        });
    }

    // this method will retry every 2 second to find out if the subgraph is synced
    // it should only return when it is, until there, it will keep the event loop blocked
    async _waitForSubgraphToIndex(log: ethers.providers.Log) {
        return new Promise(resolve => {
            async function check() {
                const isSynced = await hasSubgraphSyncedToBlock(log.blockNumber);
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

    _preFilterAndProcessEvent(log: ethers.providers.Log): boolean {
        if (
            log.address === config.communityAdminAddress ||
            this.communities.get(log.address) ||
            log.address === config.microcreditContractAddress ||
            this.assetsAddress.find(el => el.address === log.address)
        ) {
            return true;
        }
        return false;
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
                    // add subgraph beneficiary
                    await database.models.subgraphUBIBeneficiary.create({
                        userAddress: getAddress(userAddress),
                        communityAddress: getAddress(communityAddress),
                        since: (new Date().getTime() / 1000) | 0,
                        claimed: 0,
                        state: 0
                    });

                    this._waitForSubgraphToIndex(log).then(() => {
                        utils.cache.cleanBeneficiaryCache(community);
                        utils.cache.cleanUserRolesCache(userAddress);
                    });
                }

                // send notification
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
                    // update subgraph beneficiary
                    await database.models.subgraphUBIBeneficiary.update(
                        {
                            state: 1
                        },
                        {
                            where: {
                                userAddress: getAddress(userAddress),
                                communityAddress: getAddress(communityAddress)
                            }
                        }
                    );

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

                const [user, application, transactionsReceipt] = await Promise.all([
                    database.models.appUser.findOne({
                        attributes: ['id', 'language', 'walletPNT', 'appPNT'],
                        where: {
                            address: getAddress(userAddress)
                        }
                    }),
                    database.models.microCreditApplications.findOne({
                        where: {
                            userId: userAddress
                        },
                        order: [['id', 'DESC']]
                    }),
                    this.provider.getTransaction(log.transactionHash)
                ]);
                if (user) {
                    const [loanManagerUser] = await Promise.all([
                        database.models.appUser.findOne({
                            attributes: ['id'],
                            where: {
                                address: getAddress(transactionsReceipt.from)
                            }
                        }),
                        database.models.microCreditBorrowers.upsert(
                            {
                                userId: user.id,
                                applicationId: application?.id || 1,
                                manager: transactionsReceipt.from,
                                performance: 100
                            },
                            {
                                conflictFields: ['userId', 'applicationId'],
                                transaction
                            }
                        ),
                        this.microCreditService.updateApplication(
                            application !== null ? [application.id] : [userAddress],
                            [interfaces.microcredit.microCreditApplications.MicroCreditApplicationStatus.APPROVED],
                            transaction
                        )
                    ]);
                    this._waitForSubgraphToIndex(log).then(() => {
                        utils.cache.cleanUserRolesCache(userAddress);
                        if (loanManagerUser) {
                            utils.cache.cleanMicroCreditBorrowersCache(loanManagerUser.id);
                            utils.cache.cleanMicroCreditApplicationsCache(loanManagerUser.id);
                        }
                    });
                }
            } else if (parsedLog.name === 'LoanClaimed') {
                utils.Logger.info('Claim Loan event');
                const parsedLog = this.ifaceMicrocredit.parseLog(log);
                const userAddress = parsedLog.args[0];

                await database.models.microCreditApplications.update(
                    {
                        claimedOn: new Date()
                    },
                    {
                        where: {
                            userId: userAddress
                        },
                        transaction
                    }
                );
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
            } else if (parsedLog.name === 'UserAddressChanged') {
                utils.Logger.info('UserAddressChanged event');
                const newUserAddress = parsedLog.args[1];
                const transactionsReceipt = await this.provider.getTransaction(log.transactionHash);
                const [loanManagerUser, oldUser, [newUser]] = await Promise.all([
                    database.models.appUser.findOne({
                        attributes: ['id'],
                        where: {
                            address: getAddress(transactionsReceipt.from)
                        }
                    }),
                    database.models.appUser.findOne({
                        attributes: ['id'],
                        where: {
                            address: getAddress(userAddress)
                        }
                    }),
                    // in case the new user did not connect yet, we create it
                    database.models.appUser.findOrCreate({
                        attributes: ['id'],
                        where: {
                            address: getAddress(newUserAddress)
                        },
                        defaults: {
                            address: getAddress(newUserAddress)
                        },
                        transaction
                    })
                ]);
                if (oldUser && newUser) {
                    await database.models.microCreditBorrowers.update(
                        {
                            userId: newUser.id
                        },
                        {
                            where: {
                                userId: oldUser.id
                            },
                            transaction
                        }
                    );
                    this._waitForSubgraphToIndex(log).then(() => {
                        utils.cache.cleanUserRolesCache(userAddress);
                        if (loanManagerUser) {
                            utils.cache.cleanMicroCreditBorrowersCache(loanManagerUser.id);
                            utils.cache.cleanMicroCreditApplicationsCache(loanManagerUser.id);
                        }
                    });
                }
            }
        } catch (error) {
            utils.Logger.error('Failed to process Microcredit Events:', error);
        }
    }
}

export { ChainSubscribers };
