import { ManagerAttributes } from '@models/ubi/manager';
import ImMetadataService from '@services/app/imMetadata';
import BeneficiaryService from '@services/ubi/beneficiary';
import ClaimsService from '@services/ubi/claim';
import CommunityService from '@services/ubi/community';
import CommunityContractService from '@services/ubi/communityContract';
import InflowService from '@services/ubi/inflow';
import ManagerService from '@services/ubi/managers';
import { Logger } from '@utils/logger';
import { getBlockTime, notifyBeneficiaryAdded } from '@utils/util';
import { ethers } from 'ethers';

import config from '../../config';
import CommunityContractABI from '../../contracts/CommunityABI.json';
import CommunityAdminContractABI from '../../contracts/CommunityAdminABI.json';
import ERC20ABI from '../../contracts/ERC20ABI.json';
import NewCommunityContractABI from '../../contracts/NewCommunityABI.json';
import { models } from '../../database';

/* istanbul ignore next */
function asyncTxsFailure(error: any) {
    Logger.error('asyncTxsFailure ' + error);
    // should this restart the subscribers?
    process.emitWarning(error, 'TxRegistryFailureWarning');
}

class ChainSubscribers {
    provider: ethers.providers.JsonRpcProvider;
    ifaceERC20: ethers.utils.Interface;
    ifaceCommunity: ethers.utils.Interface;
    ifaceCommunityAdmin: ethers.utils.Interface;
    ifaceNewCommunity: ethers.utils.Interface;
    allCommunitiesAddresses: string[];
    communities: Map<string, string>; // TODO: to be removed
    communitiesId: Map<string, number>;
    beneficiariesInPublicCommunities: string[];
    isCommunityPublic: Map<string, boolean>;
    filterTopics: string[][];

    constructor(
        provider: ethers.providers.JsonRpcProvider,
        beneficiariesInPublicCommunities: string[],
        communities: Map<string, string>, // <address, publicId>
        communitiesId: Map<string, number>, // <address, id>
        isCommunityPublic: Map<string, boolean> // true if public community
    ) {
        this.provider = provider;
        this.ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);
        this.ifaceCommunityAdmin = new ethers.utils.Interface(
            CommunityAdminContractABI
        );
        this.ifaceNewCommunity = new ethers.utils.Interface(
            NewCommunityContractABI
        );
        this.ifaceERC20 = new ethers.utils.Interface(ERC20ABI);

        this.beneficiariesInPublicCommunities =
            beneficiariesInPublicCommunities;
        this.communities = communities;
        this.communitiesId = communitiesId;
        this.allCommunitiesAddresses = Array.from(communities.keys());
        this.isCommunityPublic = isCommunityPublic;
        this.filterTopics = [
            [
                ethers.utils.id(
                    'CommunityAdded(address,address,uint256,uint256,uint256,uint256)'
                ),
                ethers.utils.id('CommunityRemoved(address)'),
                ethers.utils.id('CommunityMigrated(address,address,address)'),
                ethers.utils.id('ManagerAdded(address)'),
                ethers.utils.id('ManagerAdded(address,address)'),
                ethers.utils.id('ManagerRemoved(address)'),
                ethers.utils.id('ManagerRemoved(address,address)'),
                ethers.utils.id('ManagerAddedToBlockList(address)'),
                ethers.utils.id('ManagerRemovedFromBlockList(address)'),
                ethers.utils.id('BeneficiaryAdded(address)'),
                ethers.utils.id('BeneficiaryAdded(address,address)'),
                // ethers.utils.id('BeneficiaryLocked(address)'),
                ethers.utils.id('BeneficiaryRemoved(address)'),
                ethers.utils.id('BeneficiaryRemoved(address,address)'),
                ethers.utils.id('BeneficiaryClaim(address,uint256)'),
                ethers.utils.id(
                    'CommunityEdited(uint256,uint256,uint256,uint256)'
                ),
                ethers.utils.id('CommunityLocked(address)'),
                ethers.utils.id('CommunityUnlocked(address)'),
                ethers.utils.id(
                    'BeneficiaryParamsUpdated(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)'
                ),
                ethers.utils.id('Transfer(address,address,uint256)'),
            ],
        ];
        this.recover();
    }

    stop() {
        this.provider.removeAllListeners();
        ImMetadataService.setRecoverBlockUsingLastBlock();
    }

    recover() {
        this._setupListener(this.provider);
        // we start the listener alongside with the recover system
        // so we know we don't lose events.
        ImMetadataService.getRecoverBlock().then((block) =>
            this._runRecoveryTxs(block, this.provider).then(() =>
                ImMetadataService.removeRecoverBlock()
            )
        );
    }

    async _runRecoveryTxs(
        startFromBlock: number,
        provider: ethers.providers.JsonRpcProvider
    ) {
        Logger.info('Recovering past events...');
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
        Logger.info('Past events recovered successfully!');
    }

    _setupListener(provider: ethers.providers.JsonRpcProvider) {
        Logger.info('Starting subscribers...');
        const filter = {
            topics: this.filterTopics,
        };

        provider.on(filter, async (log: ethers.providers.Log) => {
            await this._filterAndProcessEvent(provider, log);
            ImMetadataService.setLastBlock(log.blockNumber);
        });
    }

    async _filterAndProcessEvent(
        provider: ethers.providers.JsonRpcProvider,
        log: ethers.providers.Log
    ) {
        let parsedLog: ethers.utils.LogDescription | undefined;
        if (log.address === config.cUSDContractAddress) {
            parsedLog = await this._processCUSDEvents(log);
        } else if (this.allCommunitiesAddresses.includes(log.address)) {
            parsedLog = await this._processCommunityEvents(log);
        } else if (log.address === config.communityAdminAddress) {
            await this._processCommunityAdminEvents(log);
        } else {
            await this._processOtherEvents(log);
        }
        return parsedLog;
    }

    async _processCUSDEvents(
        log: ethers.providers.Log
    ): Promise<ethers.utils.LogDescription | undefined> {
        const parsedLog = this.ifaceERC20.parseLog(log);
        let result: ethers.utils.LogDescription | undefined = undefined;
        // only transactions to community contracts (donations) or DAO
        if (
            this.allCommunitiesAddresses.includes(parsedLog.args[1]) ||
            parsedLog.args[1] === config.DAOContractAddress
        ) {
            const from = parsedLog.args[0];
            const toCommunityAddress = parsedLog.args[1];
            const amount = parsedLog.args[2].toString();
            getBlockTime(log.blockHash).then((txAt) =>
                InflowService.add(
                    from,
                    toCommunityAddress,
                    amount,
                    log.transactionHash,
                    txAt
                ).catch(asyncTxsFailure)
            );
            result = parsedLog;
        } else if (
            // do not count from communities [eg. claims]
            !this.allCommunitiesAddresses.includes(parsedLog.args[0]) &&
            // beneficiary in public community (both from or to)
            (this.beneficiariesInPublicCommunities.includes(
                parsedLog.args[0]
            ) ||
                this.beneficiariesInPublicCommunities.includes(
                    parsedLog.args[1]
                )) &&
            // ignore AttestationProxy
            parsedLog.args[1] !== config.attestationProxyAddress &&
            // yeah, people without knowing make transactions to themselves! 🕊️
            parsedLog.args[0] !== parsedLog.args[1] &&
            // any values >0.0009cUSD (999999999999999) [eg. cUSD fees]
            parsedLog.args[2].toString().length > 15
        ) {
            const isFromBeneficiary =
                this.beneficiariesInPublicCommunities.includes(
                    parsedLog.args[0]
                );
            const beneficiaryAddress = isFromBeneficiary
                ? parsedLog.args[0]
                : parsedLog.args[1];
            const withAddress = isFromBeneficiary
                ? parsedLog.args[1]
                : parsedLog.args[0];
            // save to table to calculate txs and volume
            await BeneficiaryService.addTransaction({
                beneficiary: beneficiaryAddress,
                withAddress,
                amount: parsedLog.args[2].toString(),
                isFromBeneficiary,
                tx: log.transactionHash,
                date: new Date(), // date only
            }).catch(asyncTxsFailure);
            result = parsedLog;
        }
        return result;
    }

    async _processCommunityEvents(
        log: ethers.providers.Log
    ): Promise<ethers.utils.LogDescription | undefined> {
        let parsedLog = this.ifaceNewCommunity.parseLog(log);
        let result: ethers.utils.LogDescription | undefined = undefined;
        if (parsedLog.name === 'BeneficiaryAdded') {
            let beneficiaryAddress = '',
                managerAddress = '';

            beneficiaryAddress = parsedLog.args[1];
            managerAddress = parsedLog.args[0];

            const communityAddress = log.address;
            let communityPublicId = this.communities.get(communityAddress);
            if (communityPublicId === undefined) {
                // if for some reson (it shouldn't, might mean serious problems 😬), this is undefined
                const community =
                    await CommunityService.getOnlyCommunityByContractAddress(
                        communityAddress
                    );
                if (community === null) {
                    Logger.error(
                        `Community with address ${communityAddress} wasn't found at BeneficiaryAdded`
                    );
                } else {
                    this.isCommunityPublic.set(
                        communityAddress,
                        community.visibility === 'public'
                    );
                    this.communities.set(communityAddress, community.publicId);
                    this.allCommunitiesAddresses.push(communityAddress);
                    communityPublicId = community.publicId;
                }
            }
            const isThisCommunityPublic =
                this.isCommunityPublic.get(communityAddress);
            if (isThisCommunityPublic) {
                this.beneficiariesInPublicCommunities.push(beneficiaryAddress);
            }
            // allBeneficiaryAddressses.push(beneficiaryAddress);
            notifyBeneficiaryAdded(beneficiaryAddress, communityAddress);
            try {
                const txAt = await getBlockTime(log.blockHash);
                await BeneficiaryService.add(
                    beneficiaryAddress,
                    managerAddress,
                    communityPublicId!,
                    log.transactionHash,
                    txAt
                );
            } catch (e) {}
            result = parsedLog;
        } else if (parsedLog.name === 'BeneficiaryRemoved') {
            const communityAddress = log.address;
            let beneficiaryAddress = '',
                managerAddress = '';

            beneficiaryAddress = parsedLog.args[1];
            managerAddress = parsedLog.args[0];
            try {
                const communityPublicId =
                    this.communities.get(communityAddress)!;
                const txAt = await getBlockTime(log.blockHash);
                await BeneficiaryService.remove(
                    beneficiaryAddress,
                    managerAddress,
                    communityPublicId,
                    log.transactionHash,
                    txAt
                );
            } catch (e) {}
            result = parsedLog;
        } else if (parsedLog.name === 'BeneficiaryClaim') {
            await ClaimsService.add({
                address: parsedLog.args[0],
                communityId: this.communitiesId.get(log.address)!,
                amount: parsedLog.args[1],
                tx: log.transactionHash,
                txAt: await getBlockTime(log.blockHash),
            });
            result = parsedLog;
        } else if (parsedLog.name === 'ManagerAdded') {
            // new managers in existing community
            const managerAddress = parsedLog.args[1];
            const communityAddress = log.address;
            await ManagerService.add(
                managerAddress,
                this.communities.get(communityAddress)!
            );
            result = parsedLog;
        } else if (parsedLog.name === 'ManagerRemoved') {
            const managerAddress = parsedLog.args[1];
            const communityAddress = log.address;
            await ManagerService.remove(
                managerAddress,
                this.communities.get(communityAddress)!
            );
            result = parsedLog;
        } else if (parsedLog.name === 'ManagerAddedToBlockList') {
            const address = parsedLog.args[0];
            const communityAddress = log.address;
            await models.manager.update(
                { blocked: true },
                {
                    where: {
                        address,
                        communityId: this.communities.get(communityAddress)!,
                    },
                }
            );
            result = parsedLog;
        } else if (parsedLog.name === 'ManagerRemovedFromBlockList') {
            const address = parsedLog.args[0];
            const communityAddress = log.address;
            await models.manager.update(
                { blocked: false },
                {
                    where: {
                        address,
                        communityId: this.communities.get(communityAddress)!,
                    },
                }
            );
            result = parsedLog;
        } else if (parsedLog.name === 'CommunityEdited') {
            const communityAddress = log.address;
            await CommunityContractService.update(
                (await CommunityService.getCommunityOnlyByPublicId(
                    this.communities.get(communityAddress)!
                ))!.id,
                {
                    claimAmount: parsedLog.args[0].toString(),
                    maxClaim: parsedLog.args[1].toString(),
                    baseInterval: parsedLog.args[2].toNumber(),
                    incrementInterval: parsedLog.args[3].toNumber(),
                }
            );
            result = parsedLog;
        } else if (parsedLog.name === 'CommunityLocked') {
            await models.ubiCommunityContract.update(
                {
                    blocked: true,
                },
                {
                    where: {
                        communityId: this.communitiesId.get(log.address)!,
                    },
                }
            );
            result = parsedLog;
        } else if (parsedLog.name === 'CommunityUnlocked') {
            await models.ubiCommunityContract.update(
                {
                    blocked: false,
                },
                {
                    where: {
                        communityId: this.communitiesId.get(log.address)!,
                    },
                }
            );
            result = parsedLog;
        } else if (parsedLog.name === 'BeneficiaryParamsUpdated') {
            const communityAddress = log.address;
            await CommunityContractService.update(
                (await CommunityService.getCommunityOnlyByPublicId(
                    this.communities.get(communityAddress)!
                ))!.id,
                {
                    claimAmount: parsedLog.args[5].toString(),
                    maxClaim: parsedLog.args[6].toString(),
                    decreaseStep: parsedLog.args[7].toString(),
                    baseInterval: parsedLog.args[8].toNumber(),
                    incrementInterval: parsedLog.args[9].toNumber(),
                }
            );
            result = parsedLog;
        } else {
            // compatible with older versions
            parsedLog = this.ifaceCommunity.parseLog(log);
            if (parsedLog.name === 'BeneficiaryAdded') {
                let beneficiaryAddress = '',
                    managerAddress = '';

                beneficiaryAddress = parsedLog.args[0];
                const txResponse = await this.provider.getTransaction(
                    log.transactionHash
                );
                managerAddress = txResponse.from;

                const communityAddress = log.address;
                let communityPublicId = this.communities.get(communityAddress);
                if (communityPublicId === undefined) {
                    // if for some reson (it shouldn't, might mean serious problems 😬), this is undefined
                    const community =
                        await CommunityService.getOnlyCommunityByContractAddress(
                            communityAddress
                        );
                    if (community === null) {
                        Logger.error(
                            `Community with address ${communityAddress} wasn't found at BeneficiaryAdded`
                        );
                    } else {
                        this.isCommunityPublic.set(
                            communityAddress,
                            community.visibility === 'public'
                        );
                        this.communities.set(
                            communityAddress,
                            community.publicId
                        );
                        this.allCommunitiesAddresses.push(communityAddress);
                        communityPublicId = community.publicId;
                    }
                }
                const isThisCommunityPublic =
                    this.isCommunityPublic.get(communityAddress);
                if (isThisCommunityPublic) {
                    this.beneficiariesInPublicCommunities.push(
                        beneficiaryAddress
                    );
                }
                // allBeneficiaryAddressses.push(beneficiaryAddress);
                notifyBeneficiaryAdded(beneficiaryAddress, communityAddress);
                try {
                    const txAt = await getBlockTime(log.blockHash);
                    await BeneficiaryService.add(
                        beneficiaryAddress,
                        managerAddress,
                        communityPublicId!,
                        log.transactionHash,
                        txAt
                    );
                } catch (e) {}
                result = parsedLog;
            } else if (parsedLog.name === 'BeneficiaryRemoved') {
                const communityAddress = log.address;
                let beneficiaryAddress = '',
                    managerAddress = '';

                beneficiaryAddress = parsedLog.args[0];
                const txResponse = await this.provider.getTransaction(
                    log.transactionHash
                );
                managerAddress = txResponse.from;
                try {
                    const communityPublicId =
                        this.communities.get(communityAddress)!;
                    const txAt = await getBlockTime(log.blockHash);
                    await BeneficiaryService.remove(
                        beneficiaryAddress,
                        managerAddress,
                        communityPublicId,
                        log.transactionHash,
                        txAt
                    );
                } catch (e) {}
                result = parsedLog;
            } else if (parsedLog.name === 'ManagerAdded') {
                // new managers in existing community
                const managerAddress = parsedLog.args[0];
                const communityAddress = log.address;
                await ManagerService.add(
                    managerAddress,
                    this.communities.get(communityAddress)!
                );
                result = parsedLog;
            } else if (parsedLog.name === 'ManagerRemoved') {
                const managerAddress = parsedLog.args[0];
                const communityAddress = log.address;
                await ManagerService.remove(
                    managerAddress,
                    this.communities.get(communityAddress)!
                );
                result = parsedLog;
            }
        }
        return result;
    }

    async _processCommunityAdminEvents(
        log: ethers.providers.Log
    ): Promise<ethers.utils.LogDescription | undefined> {
        const parsedLog = this.ifaceCommunityAdmin.parseLog(log);
        let result: ethers.utils.LogDescription | undefined = undefined;

        if (parsedLog.name === 'CommunityRemoved') {
            const communityAddress = parsedLog.args[0];
            const community = await models.community.findOne({
                attributes: ['publicId'],
                where: { contractAddress: communityAddress },
            });

            if (!community || !community.publicId) {
                Logger.error(
                    `Community with address ${communityAddress} wasn't found at "CommunityRemoved"`
                );
            } else {
                await models.community.update(
                    {
                        status: 'removed',
                        deletedAt: new Date(),
                    },
                    {
                        where: { contractAddress: communityAddress },
                    }
                );
                await models.beneficiary.update(
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

            const community = await models.community.update(
                {
                    contractAddress: communityAddress,
                    status: 'valid',
                },
                {
                    where: {
                        requestByAddress: managerAddress,
                    },
                }
            );
            if (community[0] === 0) {
                Logger.error(
                    `Community with address ${communityAddress} wasn't updated at "CommunityAdded"`
                );
            }

            result = parsedLog;
        } else if (parsedLog.name === 'CommunityMigrated') {
            const communityAddress = parsedLog.args[1];
            const previousCommunityAddress = parsedLog.args[2];

            const community = await models.community.update(
                {
                    contractAddress: communityAddress,
                },
                {
                    where: {
                        contractAddress: previousCommunityAddress,
                    },
                }
            );
            if (community[0] === 0) {
                Logger.error(
                    `Community with address ${communityAddress} wasn't updated at "CommunityMigrated"`
                );
            }

            result = parsedLog;
        }

        return result;
    }

    async _processOtherEvents(log: ethers.providers.Log): Promise<void> {
        try {
            let parsedLog: ethers.utils.LogDescription;
            if (log.address === config.communityContractAddress) {
                parsedLog = this.ifaceNewCommunity.parseLog(log);
            } else {
                parsedLog = this.ifaceCommunity.parseLog(log);
            }
            if (parsedLog.name === 'ManagerAdded') {
                const managerAddress =
                    parsedLog.args.length > 1
                        ? parsedLog.args[1]
                        : parsedLog.args[0];
                const communityAddress = log.address;
                if (this.allCommunitiesAddresses.includes(communityAddress)) {
                    await ManagerService.add(
                        managerAddress,
                        this.communities.get(communityAddress)!
                    );
                } else {
                    const communityAddressesAndIds =
                        await CommunityService.getAllAddressesAndIds();
                    if (
                        Array.from(communityAddressesAndIds.keys()).includes(
                            communityAddress
                        )
                    ) {
                        // in case new manager means new community
                        const communityId =
                            communityAddressesAndIds.get(communityAddress)!;
                        await ManagerService.add(managerAddress, communityId);
                        const community =
                            await CommunityService.getOnlyCommunityByContractAddress(
                                communityAddress
                            );
                        if (community === null) {
                            Logger.error(
                                `Community with address ${communityAddress} wasn't found at "ManagerAdded"`
                            );
                        } else {
                            this.isCommunityPublic.set(
                                communityAddress,
                                community.visibility === 'public'
                            );
                            const findCommunity =
                                await models.community.findOne({
                                    attributes: ['id'],
                                    where: { publicId: communityId },
                                });
                            this.communities.set(communityAddress, communityId);
                            this.communitiesId.set(
                                communityAddress,
                                findCommunity!.id
                            );
                            this.allCommunitiesAddresses.push(communityAddress);
                        }
                    } else {
                        // if for some reason (mainly timing), the community wasn't in the database, try again in 4 secs
                        // try only 5 times
                        let triesToRecover = 5;
                        const cancelTimeout = setInterval(
                            async (
                                _managerAddress: string,
                                _communityAddress: string
                            ) => {
                                Logger.warn(
                                    `Community ${_communityAddress} was not in the database when "ManagerAdded".`
                                );
                                const communityAddressesAndIds =
                                    await CommunityService.getAllAddressesAndIds();
                                if (
                                    Array.from(
                                        communityAddressesAndIds.keys()
                                    ).includes(_communityAddress) &&
                                    !this.allCommunitiesAddresses.includes(
                                        _communityAddress
                                    )
                                ) {
                                    // new community
                                    const communityId =
                                        communityAddressesAndIds.get(
                                            communityAddress
                                        )!;
                                    ManagerService.add(
                                        _managerAddress,
                                        communityId
                                    );
                                    const community =
                                        await CommunityService.getOnlyCommunityByContractAddress(
                                            communityAddress
                                        );
                                    if (community === null) {
                                        Logger.error(
                                            `Community with address ${communityAddress} wasn't found at "ManagerAdded"`
                                        );
                                    } else {
                                        this.isCommunityPublic.set(
                                            communityAddress,
                                            community.visibility === 'public'
                                        );
                                        this.communities.set(
                                            _communityAddress,
                                            communityId
                                        );
                                        this.allCommunitiesAddresses.push(
                                            _communityAddress
                                        );
                                    }
                                    clearInterval(cancelTimeout);
                                }
                                triesToRecover--;
                                if (triesToRecover === 0) {
                                    clearInterval(cancelTimeout);
                                }
                            },
                            4000,
                            managerAddress,
                            communityAddress
                        );
                    }
                }
            }
        } catch (e) {
            // as this else catch events from anywhere, it might catch unwanted events
            if (e.reason !== 'no matching event') {
                Logger.error('no matching event ' + e);
            }
        }
    }
}

export { ChainSubscribers };
