import {
    services,
    utils,
    config,
    contracts,
    database,
} from '../../';
import { ethers } from 'ethers';

class ChainSubscribers {
    provider: ethers.providers.JsonRpcProvider;
    ifaceCommunityAdmin: ethers.utils.Interface;
    filterTopics: string[][];

    constructor(provider: ethers.providers.JsonRpcProvider) {
        this.provider = provider;
        this.ifaceCommunityAdmin = new ethers.utils.Interface(
            contracts.CommunityAdminABI
        );

        this.filterTopics = [
            [
                ethers.utils.id(
                    'CommunityAdded(address,address[],uint256,uint256,uint256,uint256,uint256,uint256,uint256)'
                ),
                ethers.utils.id('CommunityRemoved(address)'),
            ],
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
        services.app.ImMetadataService.getRecoverBlock().then((block) =>
            this._runRecoveryTxs(block, this.provider).then(() =>
                services.app.ImMetadataService.removeRecoverBlock()
            )
        );
    }

    async _runRecoveryTxs(
        startFromBlock: number,
        provider: ethers.providers.JsonRpcProvider
    ) {
        utils.Logger.info('Recovering past events...');
        const rawLogs = await provider.getLogs({
            fromBlock: startFromBlock,
            toBlock: 'latest',
            topics: this.filterTopics,
        });

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
        for (let x = 0; x < logs.length; x += 1) {
            // verify if cusd or community and do things
            await this._filterAndProcessEvent(provider, logs[x]);
        }
        utils.Logger.info('Past events recovered successfully!');
    }

    _setupListener(provider: ethers.providers.JsonRpcProvider) {
        utils.Logger.info('Starting subscribers...');
        const filter = {
            topics: this.filterTopics,
        };

        provider.on(filter, async (log: ethers.providers.Log) => {
            await this._filterAndProcessEvent(provider, log);
            services.app.ImMetadataService.setLastBlock(log.blockNumber);
        });
    }

    async _filterAndProcessEvent(
        provider: ethers.providers.JsonRpcProvider,
        log: ethers.providers.Log
    ) {
        let parsedLog: ethers.utils.LogDescription | undefined;
        if (log.address === config.communityAdminAddress) {
            await this._processCommunityAdminEvents(log);
        }
        return parsedLog;
    }

    async _processCommunityAdminEvents(
        log: ethers.providers.Log
    ): Promise<ethers.utils.LogDescription | undefined> {
        const parsedLog = this.ifaceCommunityAdmin.parseLog(log);
        let result: ethers.utils.LogDescription | undefined = undefined;

        if (parsedLog.name === 'CommunityRemoved') {
            const communityAddress = parsedLog.args[0];
            const community = await database.models.community.findOne({
                attributes: ['publicId'],
                where: { contractAddress: communityAddress },
            });

            if (!community || !community.publicId) {
                utils.Logger.error(
                    `Community with address ${communityAddress} wasn't found at "CommunityRemoved"`
                );
            } else {
                await database.models.community.update(
                    {
                        status: 'removed',
                        deletedAt: new Date(),
                    },
                    {
                        where: { contractAddress: communityAddress },
                    }
                );
                await database.models.beneficiary.update(
                    {
                        active: false,
                    },
                    {
                        where: {
                            communityId: community.publicId,
                        },
                    }
                );
                result = parsedLog;
            }
        } else if (parsedLog.name === 'CommunityAdded') {
            const communityAddress = parsedLog.args[0];
            const managerAddress = parsedLog.args[1];

            const _pCommunity = await database.models.community.findOne({
                attributes: ['id', 'publicId'],
                where: {
                    requestByAddress: managerAddress[0],
                },
            });
            for (let index = 0; index < managerAddress.length; index++) {
                await services.ubi.ManagerService.add(
                    managerAddress[index],
                    _pCommunity!.id
                );
            }

            const community = await database.models.community.update(
                {
                    contractAddress: communityAddress,
                    status: 'valid',
                },
                {
                    where: {
                        requestByAddress: managerAddress[0],
                    },
                }
            );
            if (community[0] === 0) {
                utils.Logger.error(
                    `Community with address ${communityAddress} wasn't updated at "CommunityAdded"`
                );
            }

            result = parsedLog;
        }

        return result;
    }
}

export { ChainSubscribers };
