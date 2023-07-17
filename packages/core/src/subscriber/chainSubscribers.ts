import { MicroCreditApplicationStatus } from '../interfaces/microCredit/applications';
import { Create as MicroCreditCreate } from '../services/microcredit';
import { NotificationType } from '../interfaces/app/appNotification';
import { Transaction } from 'sequelize';
import { config, contracts, database, services, utils } from '../../';
import { ethers } from 'ethers';
import { getAddress } from '@ethersproject/address';
import { models } from '../database';
import { sendNotification } from '../utils/pushNotification';

class ChainSubscribers {
    provider: ethers.providers.JsonRpcProvider;
    providerFallback: ethers.providers.JsonRpcProvider;
    ifaceCommunityAdmin: ethers.utils.Interface;
    ifaceCommunity: ethers.utils.Interface;
    ifaceMicrocredit: ethers.utils.Interface;
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

        // iterate
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
        utils.Logger.info('Past events recovered successfully!');
    }

    async _getLogs(startFromBlock: number, provider: ethers.providers.JsonRpcProvider) {
        const filterTopics = [
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
        // TODO: recover 100 blocks at a time
        return provider.getLogs({
            fromBlock: startFromBlock,
            toBlock: 'latest',
            topics: filterTopics
        });
    }

    _setupListener(provider: ethers.providers.JsonRpcProvider) {
        utils.Logger.info('Starting subscribers...');
        database.redisClient.set('blockCount', 0);

        provider.on('block', async (blockNumber: number) => {
            utils.Logger.info('Receiving new block');
            const block = await provider.getBlock(blockNumber);
            // get all the logs happening only on transactions in impactMarket contracts
            const transactions: ethers.providers.Log[] = [];
            for (let x = 0; x < block.transactions.length; x++) {
                const transaction = await provider.getTransactionReceipt(block.transactions[x]);
                if (
                    transaction.to === config.communityAdminAddress ||
                    this.communities.get(transaction.to) ||
                    transaction.to === config.microcreditContractAddress
                ) {
                    transactions.push(...transaction.logs);
                }
            }
            try {
                await database.sequelize.transaction(async t => {
                    const processingLogsPromises: Promise<void>[] = [];
                    for (let x = 0; x < transactions.length; x++) {
                        processingLogsPromises.push(this._filterAndProcessEvent(transactions[x], t));
                    }
                    await Promise.all(processingLogsPromises);
                });
            } catch (error) {
                // TODO: add error handling
            }

            database.redisClient.set('lastBlock', blockNumber);
            const blockCount = await database.redisClient.get('blockCount');

            if (!!blockCount && blockCount > '16560') {
                services.app.ImMetadataService.setLastBlock(blockNumber);
                database.redisClient.set('blockCount', 0);
            } else {
                database.redisClient.incr('blockCount');
            }
        });
    }

    async _filterAndProcessEvent(log: ethers.providers.Log, transaction: Transaction) {
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

                const community = await database.models.community.update(
                    {
                        contractAddress: communityAddress,
                        status: 'valid'
                    },
                    {
                        where: {
                            requestByAddress: managerAddress[0]
                        },
                        transaction,
                        returning: true
                    }
                );
                if (community[0] === 0) {
                    utils.Logger.error(`Community with address ${communityAddress} wasn't updated at "CommunityAdded"`);
                } else {
                    this.communities.set(communityAddress, community[1][0].id);
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
                                communityId: community[1][0].id
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
                    utils.cache.cleanBeneficiaryCache(community);
                }
                const user = await models.appUser.findOne({
                    attributes: ['id', 'language', 'walletPNT', 'appPNT'],
                    where: {
                        address: getAddress(userAddress)
                    }
                });

                if (user) {
                    await sendNotification(
                        [user.toJSON()],
                        NotificationType.BENEFICIARY_ADDED,
                        true,
                        true,
                        {
                            communityId: community
                        },
                        transaction
                    );
                }
            } else if (parsedLog.name === 'BeneficiaryRemoved') {
                utils.Logger.info('Remove Beneficiary event');

                const communityAddress = log.address;
                const community = this.communities.get(communityAddress);

                if (community) {
                    utils.cache.cleanBeneficiaryCache(community);
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

                const user = await models.appUser.findOne({
                    attributes: ['id', 'language', 'walletPNT', 'appPNT'],
                    where: {
                        address: getAddress(userAddress)
                    }
                });

                if (user) {
                    const [transactionsReceipt] = await Promise.all([
                        this.provider.getTransaction(log.transactionHash),
                        this.microCreditService.updateApplication(
                            [userAddress],
                            [MicroCreditApplicationStatus.APPROVED]
                        ),
                        sendNotification(
                            [user.toJSON()],
                            NotificationType.LOAN_ADDED,
                            true,
                            true,
                            undefined,
                            transaction
                        )
                    ]);
                    await models.microCreditBorrowers.create(
                        {
                            userId: user.id,
                            performance: 100,
                            manager: transactionsReceipt.from
                        },
                        { transaction }
                    );
                }
            } else if (parsedLog.name === 'ManagerChanged') {
                utils.Logger.info('ManagerChanged event');

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
            utils.Logger.error('Failed to process Microcredit Events:', error);
        }
    }
}

export { ChainSubscribers };
