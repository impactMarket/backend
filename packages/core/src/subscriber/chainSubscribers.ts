import { Logger } from '../utils/logger';
import { MicroCreditApplicationStatus } from '../interfaces/microCredit/applications';
import { Create as MicroCreditCreate } from '../services/microcredit';
import { NotificationParamsPath, NotificationType } from '../interfaces/app/appNotification';
import { Transaction } from 'sequelize';
import { config, contracts, database, services, utils, subgraph } from '../../';
import { ethers } from 'ethers';
import { getAddress } from '@ethersproject/address';
import { models, sequelize } from '../database';
import { sendNotification } from '../utils/pushNotification';

class ChainSubscribers {
    provider: ethers.providers.JsonRpcProvider;
    providerFallback: ethers.providers.JsonRpcProvider;
    ifaceCommunityAdmin: ethers.utils.Interface;
    ifaceCommunity: ethers.utils.Interface;
    ifaceMicrocredit: ethers.utils.Interface;
    filterTopics: string[][];
    communities: Map<string, number>;
    microCreditService: MicroCreditCreate;

    constructor(
        jsonRpcProvider: ethers.providers.JsonRpcProvider,
        jsonRpcProviderFallback: ethers.providers.JsonRpcProvider,
        communities: Map<string, number>
    ) {
        this.provider = jsonRpcProvider;
        this.providerFallback = jsonRpcProviderFallback;
        this.ifaceCommunityAdmin = new ethers.utils.Interface(contracts.CommunityAdminABI);
        this.ifaceCommunity = new ethers.utils.Interface(contracts.CommunityABI);
        this.ifaceMicrocredit = new ethers.utils.Interface(contracts.MicrocreditABI);
        this.communities = communities;
        this.microCreditService = new MicroCreditCreate();
        this.filterTopics = [
            [
                ethers.utils.id(
                    'CommunityAdded(address,address[],uint256,uint256,uint256,uint256,uint256,uint256,uint256)'
                ),
                ethers.utils.id('CommunityRemoved(address)'),
                ethers.utils.id('BeneficiaryAdded(address,address)'),
                ethers.utils.id('BeneficiaryRemoved(address,address)'),
                ethers.utils.id('LoanAdded(address,uint256,uint256,uint256,uint256,uint256)'),
                ethers.utils.id('ManagerChanged(address,address)')
            ]
        ];
        this.recover();
    }

    stop() {
        this.provider.removeAllListeners();
        services.app.ImMetadataService.setRecoverBlockUsingLastBlock();
    }

    recover() {
        this._setupListener(this.provider);
        // we start the listener alongside with the recover system
        // so we know we don't lose events.
        this._runRecoveryTxs(this.provider, this.providerFallback)
            .then(() => services.app.ImMetadataService.removeRecoverBlock())
            .catch(error => Logger.error('Failed to recover past events!', error));
    }

    async _runRecoveryTxs(
        provider: ethers.providers.JsonRpcProvider,
        fallbackProvider: ethers.providers.JsonRpcProvider
    ) {
        Logger.info('Recovering past events...');
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
            Logger.info('Got logs from main provider!');
        } catch (error) {
            Logger.error('Failed to get logs from main provider!', error);
            rawLogs = await this._getLogs(startFromBlock, fallbackProvider);
            Logger.info('Got logs from fallback provider!');
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
                services.app.ImMetadataService.setLastBlock(logs[logs.length - 1].blockNumber);
            });
        } catch (error) {
            // TODO: add error handling
        }
        Logger.info('Past events recovered successfully!');
    }

    async _getLogs(startFromBlock: number, provider: ethers.providers.JsonRpcProvider) {
        return provider.getLogs({
            fromBlock: startFromBlock,
            toBlock: 'latest',
            topics: this.filterTopics
        });
    }

    _setupListener(provider: ethers.providers.JsonRpcProvider) {
        Logger.info('Starting subscribers...');
        const filter = {
            topics: this.filterTopics
        };

        database.redisClient.set('blockCount', 0);
        const savedLogs = new Map<number, ethers.providers.Log[]>();

        // to reduce commits to the database, we will save the last block
        // and only process all logs once we get a new block
        provider.on(filter, async (log: ethers.providers.Log) => {
            Logger.info('Receiving new event');
            // get last saved block and current block
            const lastBlock = parseInt((await database.redisClient.get('lastBlock')) ?? '0', 10);
            const currentBlock = log.blockNumber;
            if (currentBlock - lastBlock > 0) {
                database.redisClient.set('lastBlock', currentBlock);
                // process all last block logs
                const lastBlockLogs = savedLogs.get(lastBlock) ?? [log];
                try {
                    Logger.info(`Processing logs (${lastBlock}) (${lastBlockLogs.length} txs)...`);
                    const before = Date.now();
                    await sequelize.transaction(async transaction => {
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
                    Logger.info(`Logs processed! Elapsed: ${Date.now() - before}ms`);
                } catch (error) {
                    Logger.error('Failed to process logs!', error);
                }
            } else {
                // save current log
                const currentLogs = savedLogs.get(currentBlock) ?? [];
                currentLogs.push(log);
                savedLogs.set(currentBlock, currentLogs);
            }
        });
    }

    async _filterAndProcessEvent(log: ethers.providers.Log, transaction: Transaction): Promise<void> {
        if (log.address === config.communityAdminAddress) {
            await this._processCommunityAdminEvents(log, transaction);
        } else if (this.communities.get(log.address)) {
            await this._processCommunityEvents(log, transaction);
        } else if (log.address === config.microcreditContractAddress) {
            await this._processMicrocreditEvents(log, transaction);
        }
    }

    async _processCommunityAdminEvents(log: ethers.providers.Log, transaction: Transaction): Promise<void> {
        try {
            const parsedLog = this.ifaceCommunityAdmin.parseLog(log);

            if (parsedLog.name === 'CommunityRemoved') {
                Logger.info('Remove Community event');

                const communityAddress = parsedLog.args[0];
                const community = await database.models.community.findOne({
                    attributes: ['id'],
                    where: { contractAddress: communityAddress }
                });

                if (!community || !community.id) {
                    Logger.error(`Community with address ${communityAddress} wasn't found at "CommunityRemoved"`);
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
                Logger.info('Add Community event');

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
                    Logger.error(`Community with address ${communityAddress} wasn't updated at "CommunityAdded"`);
                } else {
                    this.communities.set(communityAddress, affectedRows[0].id);
                    const user = await models.appUser.findOne({
                        attributes: ['id', 'language', 'walletPNT', 'appPNT'],
                        where: {
                            address: getAddress(managerAddress[0])
                        }
                    });
                    if (user) {
                        await sendNotification(
                            [user.toJSON()],
                            NotificationType.COMMUNITY_CREATED,
                            true,
                            true,
                            {
                                path: `${NotificationParamsPath.COMMUNITY}${affectedRows[0].id}`
                            },
                            transaction
                        );
                    }
                }
            }
        } catch (error) {
            Logger.error('Failed to process Community Admin Events:', error);
        }
    }

    async _processCommunityEvents(log: ethers.providers.Log, transaction: Transaction): Promise<void> {
        try {
            const parsedLog = this.ifaceCommunity.parseLog(log);

            if (parsedLog.name === 'BeneficiaryAdded') {
                Logger.info('Add Beneficiary event');

                const communityAddress = log.address;
                const community = this.communities.get(communityAddress);
                const userAddress = parsedLog.args[1];

                async function cleanCacheAndRetry(beneficiaries: { address: string }[]) {
                    if (beneficiaries.length) {
                        utils.cache.cleanBeneficiaryCache(community!);
                    } else {
                        setTimeout(async () => {
                            const updatedBeneficiaries = await subgraph.queries.beneficiary.getBeneficiariesByChangeBlock(log.blockNumber);
                            cleanCacheAndRetry(updatedBeneficiaries);
                        }, 5000);
                    }
                }
                
                if (community) {
                    const beneficiaries = await subgraph.queries.beneficiary.getBeneficiariesByChangeBlock(log.blockNumber);
                    cleanCacheAndRetry(beneficiaries);
                }

                const user = await models.appUser.findOne({
                    attributes: ['id', 'language', 'walletPNT', 'appPNT'],
                    where: {
                        address: getAddress(userAddress)
                    }
                });
                if (user && community) {
                    await sendNotification(
                        [user.toJSON()],
                        NotificationType.BENEFICIARY_ADDED,
                        true,
                        true,
                        {
                            path: `${NotificationParamsPath.COMMUNITY}${community}`
                        },
                        transaction
                    );
                }
            } else if (parsedLog.name === 'BeneficiaryRemoved') {
                Logger.info('Remove Beneficiary event');

                const communityAddress = log.address;
                const community = this.communities.get(communityAddress);

                if (community) {
                    utils.cache.cleanBeneficiaryCache(community);
                }
            }
        } catch (error) {
            Logger.error('Failed to process Community Events:', error);
        }
    }

    async _processMicrocreditEvents(log: ethers.providers.Log, transaction: Transaction): Promise<void> {
        try {
            const parsedLog = this.ifaceMicrocredit.parseLog(log);
            const userAddress = parsedLog.args[0];

            if (parsedLog.name === 'LoanAdded') {
                Logger.info('Add Loan event');

                const [user, transactionsReceipt] = await Promise.all([
                    models.appUser.findOne({
                        attributes: ['id', 'language', 'walletPNT', 'appPNT'],
                        where: {
                            address: getAddress(userAddress)
                        }
                    }),
                    this.provider.getTransaction(log.transactionHash)
                ]);
                if (user) {
                    const [[borrower, created]] = await Promise.all([
                        models.microCreditBorrowers.findOrCreate({
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
                        this.microCreditService.updateApplication(
                            [userAddress],
                            [MicroCreditApplicationStatus.APPROVED],
                            transaction
                        )
                    ]);
                    if (!created) {
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
                Logger.info('ManagerChanged event');

                const user = await models.appUser.findOne({
                    attributes: ['id'],
                    where: {
                        address: getAddress(userAddress)
                    }
                });
                if (user) {
                    await models.microCreditBorrowers.update(
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
            Logger.error('Failed to process Microcredit Events:', error);
        }
    }
}

export { ChainSubscribers };
