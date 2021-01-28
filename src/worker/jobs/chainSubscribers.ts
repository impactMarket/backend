import { Logger } from '@utils/logger';
import { Community } from '@models/community';
// import ImpactMarketContractABI from '../contracts/ImpactMarketABI.json';
import BeneficiaryService from '@services/beneficiary';
import BeneficiaryTransactionService from '@services/beneficiaryTransaction';
import ClaimsService from '@services/claim';
import CommunityService from '@services/community';
import ImMetadataService from '@services/imMetadata';
import InflowService from '@services/inflow';
import ManagerService from '@services/managers';
import TransactionsService from '@services/transactions';
import { ethers } from 'ethers';

import config from '../../config';
import CommunityContractABI from '../../contracts/CommunityABI.json';
import ERC20ABI from '../../contracts/ERC20ABI.json';
import { getBlockTime, notifyBeneficiaryAdded } from '@utils/util';

// interface IFilterCommunityTmpData {
//     address: string;
//     block?: number;
// }

function catchHandlerTransactionsService(error: any) {
    // that's fine if it is a SequelizeUniqueConstraintError
    // it's already there 👌
    if (error.name !== 'SequelizeUniqueConstraintError') {
        Logger.error('catchHandlerTransactionsService ' + error);
    }
}

function asyncTxsFailure(error: any) {
    Logger.error('asyncTxsFailure ' + error);
    // should this restart the subscribers?
    process.emitWarning(error, 'TxRegistryFailureWarning');
}

async function subscribeChainEvents(
    provider: ethers.providers.JsonRpcProvider,
    communities: Map<string, string>, // <address, publicId>
    isCommunityPublic: Map<string, boolean> // true if public community
    // beneficiariesInPublicCommunities: string[]
): Promise<void> {
    const filter = {
        topics: [
            [
                // ethers.utils.id('CommunityAdded(address,address,uint256,uint256,uint256,uint256)'),
                // ethers.utils.id('CommunityRemoved(address)'),
                ethers.utils.id('ManagerAdded(address)'),
                ethers.utils.id('ManagerRemoved(address)'),
                ethers.utils.id('BeneficiaryAdded(address)'),
                // ethers.utils.id('BeneficiaryLocked(address)'),
                ethers.utils.id('BeneficiaryRemoved(address)'),
                ethers.utils.id('BeneficiaryClaim(address,uint256)'),
                // ethers.utils.id('CommunityEdited(uint256,uint256,uint256,uint256)'),
                ethers.utils.id('Transfer(address,address,uint256)'),
            ],
        ],
    };
    // const ifaceImpactMarket = new ethers.utils.Interface(ImpactMarketContractABI);
    const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);
    const ifaceERC20 = new ethers.utils.Interface(ERC20ABI);
    // const allBeneficiaryAddressses = await BeneficiaryService.getAllAddresses();
    const beneficiariesInPublicCommunities = await BeneficiaryService.getAllAddressesInPublicValidCommunities();
    const allCommunitiesAddresses = Array.from(communities.keys());
    const allCommunities = communities;
    // TODO: remove await
    provider.on(filter, async (log: ethers.providers.Log) => {
        let parsedLog: ethers.utils.LogDescription | undefined;
        if (log.address === config.cUSDContractAddress) {
            const preParsedLog = ifaceERC20.parseLog(log);
            // only transactions to community contracts (donations)
            if (allCommunitiesAddresses.includes(preParsedLog.args[1])) {
                parsedLog = preParsedLog;
                const from = parsedLog.args[0];
                const toCommunityAddress = parsedLog.args[1];
                const communityId = allCommunities.get(toCommunityAddress)!;
                const amount = parsedLog.args[2].toString();
                getBlockTime(log.blockHash).then((txAt) =>
                    InflowService.add(
                        from,
                        communityId,
                        amount,
                        log.transactionHash,
                        txAt
                    ).catch(asyncTxsFailure)
                );
            } else if (
                // do not count from communities [eg. claims]
                !allCommunitiesAddresses.includes(preParsedLog.args[0]) &&
                // beneficiary in public community (both from or to)
                (beneficiariesInPublicCommunities.includes(
                    preParsedLog.args[0]
                ) ||
                    beneficiariesInPublicCommunities.includes(
                        preParsedLog.args[1]
                    )) &&
                // ignore AttestationProxy
                preParsedLog.args[1] !== config.attestationProxyAddress &&
                // yeah, people without knowing make transactions to themselves! 🕊️
                preParsedLog.args[0] !== preParsedLog.args[1] &&
                // any values >0.0009cUSD (999999999999999) [eg. cUSD fees]
                preParsedLog.args[2].toString().length > 15
            ) {
                const isFromBeneficiary = beneficiariesInPublicCommunities.includes(
                    preParsedLog.args[0]
                );
                // TODO: remove
                if (
                    isFromBeneficiary ||
                    beneficiariesInPublicCommunities.includes(
                        preParsedLog.args[1]
                    )
                ) {
                    const _parsedLog = preParsedLog; // TODO: rename to parsedLog
                    const beneficiaryAddress = isFromBeneficiary
                        ? _parsedLog.args[0]
                        : _parsedLog.args[1];
                    const withAddress = isFromBeneficiary
                        ? _parsedLog.args[1]
                        : _parsedLog.args[0];
                    // save to table to calculate txs and volume
                    BeneficiaryTransactionService.add({
                        beneficiary: beneficiaryAddress,
                        withAddress,
                        amount: _parsedLog.args[2].toString(),
                        isFromBeneficiary,
                        tx: log.transactionHash,
                        date: new Date(), // date only
                    }).catch(asyncTxsFailure);
                }
            }
            //
        } else if (allCommunitiesAddresses.includes(log.address)) {
            parsedLog = ifaceCommunity.parseLog(log);
            if (parsedLog.name === 'BeneficiaryAdded') {
                const beneficiaryAddress = parsedLog.args[0];
                const communityAddress = log.address;
                let communityId = allCommunities.get(communityAddress);
                if (communityId === undefined) {
                    // if for some reson (it shouldn't, might mean serious problems 😬), this is undefined
                    const community = await CommunityService.getOnlyCommunityByContractAddress(
                        communityAddress
                    );
                    if (community === null) {
                        Logger.error(
                            `Community with address ${communityAddress} wasn't found at BeneficiaryAdded`
                        );
                    } else {
                        isCommunityPublic.set(
                            communityAddress,
                            community.visibility === 'public'
                        );
                        allCommunities.set(
                            communityAddress,
                            community.publicId
                        );
                        allCommunitiesAddresses.push(communityAddress);
                        communityId = community.publicId;
                    }
                }
                const isThisCommunityPublic = isCommunityPublic.get(
                    communityAddress
                );
                if (isThisCommunityPublic) {
                    beneficiariesInPublicCommunities.push(beneficiaryAddress);
                }
                // allBeneficiaryAddressses.push(beneficiaryAddress);
                notifyBeneficiaryAdded(beneficiaryAddress, communityAddress);
                getBlockTime(log.blockHash).then((txAt) =>
                    BeneficiaryService.add(
                        beneficiaryAddress,
                        communityId!,
                        log.transactionHash,
                        txAt
                    ).catch(asyncTxsFailure)
                );
            } else if (parsedLog.name === 'BeneficiaryRemoved') {
                const beneficiaryAddress = parsedLog.args[0];
                BeneficiaryService.remove(beneficiaryAddress);
            } else if (parsedLog.name === 'BeneficiaryClaim') {
                const beneficiaryAddress = parsedLog.args[0];
                const amount = parsedLog.args[1];
                const communityId = allCommunities.get(log.address)!;
                getBlockTime(log.blockHash).then((txAt) =>
                    ClaimsService.add(
                        beneficiaryAddress,
                        communityId,
                        amount,
                        log.transactionHash,
                        txAt
                    )
                );
            } else if (parsedLog.name === 'ManagerAdded') {
                // new managers in existing community
                const managerAddress = parsedLog.args[0];
                const communityAddress = log.address;
                ManagerService.add(
                    managerAddress,
                    allCommunities.get(communityAddress)!
                );
            } else if (parsedLog.name === 'ManagerRemoved') {
                const managerAddress = parsedLog.args[0];
                const communityAddress = log.address;
                ManagerService.remove(
                    managerAddress,
                    allCommunities.get(communityAddress)!
                );
            }
        } else {
            try {
                parsedLog = ifaceCommunity.parseLog(log);
                if (parsedLog.name === 'ManagerAdded') {
                    const managerAddress = parsedLog.args[0];
                    const communityAddress = log.address;
                    if (allCommunitiesAddresses.includes(communityAddress)) {
                        ManagerService.add(
                            managerAddress,
                            allCommunities.get(communityAddress)!
                        );
                    } else {
                        const communityAddressesAndIds = await CommunityService.getAllAddressesAndIds();
                        if (
                            Array.from(
                                communityAddressesAndIds.keys()
                            ).includes(communityAddress)
                        ) {
                            // in case new manager means new community
                            const communityId = communityAddressesAndIds.get(
                                communityAddress
                            )!;
                            ManagerService.add(managerAddress, communityId);
                            const community = await CommunityService.getOnlyCommunityByContractAddress(
                                communityAddress
                            );
                            if (community === null) {
                                Logger.error(
                                    `Community with address ${communityAddress} wasn't found at "ManagerAdded"`
                                );
                            } else {
                                isCommunityPublic.set(
                                    communityAddress,
                                    community.visibility === 'public'
                                );
                                allCommunities.set(
                                    communityAddress,
                                    communityId
                                );
                                allCommunitiesAddresses.push(communityAddress);
                            }
                        } else {
                            // if for some reason (mainly timing), the community wasn't in the database, try again in 4 secs
                            const cancelTimeout = setInterval(
                                async (
                                    _managerAddress: string,
                                    _communityAddress: string
                                ) => {
                                    Logger.warn(
                                        `Community ${_communityAddress} was not in the database when "ManagerAdded".`
                                    );
                                    const communityAddressesAndIds = await CommunityService.getAllAddressesAndIds();
                                    if (
                                        Array.from(
                                            communityAddressesAndIds.keys()
                                        ).includes(_communityAddress) &&
                                        !allCommunitiesAddresses.includes(
                                            _communityAddress
                                        )
                                    ) {
                                        // new community
                                        const communityId = communityAddressesAndIds.get(
                                            communityAddress
                                        )!;
                                        ManagerService.add(
                                            _managerAddress,
                                            communityId
                                        );
                                        const community = await CommunityService.getOnlyCommunityByContractAddress(
                                            communityAddress
                                        );
                                        if (community === null) {
                                            Logger.error(
                                                `Community with address ${communityAddress} wasn't found at "ManagerAdded"`
                                            );
                                        } else {
                                            isCommunityPublic.set(
                                                communityAddress,
                                                community.visibility ===
                                                    'public'
                                            );
                                            allCommunities.set(
                                                _communityAddress,
                                                communityId
                                            );
                                            allCommunitiesAddresses.push(
                                                _communityAddress
                                            );
                                        }
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
                    Logger.error(e);
                }
            }
        }
        if (parsedLog !== undefined) {
            TransactionsService.add(provider, log, parsedLog).catch(
                catchHandlerTransactionsService
            );
        }
        ImMetadataService.setLastBlock(log.blockNumber);
    });
}

// async function updateImpactMarketCache(
//     provider: ethers.providers.JsonRpcProvider,
//     startFromBlock: number
// ): Promise<string[]> {
//     const ifaceImpactMarket = new ethers.utils.Interface(
//         ImpactMarketContractABI
//     );

//     const logsImpactMarket = await provider.getLogs({
//         address: config.impactMarketContractAddress,
//         fromBlock: startFromBlock,
//         toBlock: 'latest',
//         topics: [
//             [
//                 ethers.utils.id('CommunityAdded(address,address,uint256,uint256,uint256,uint256)'),
//                 // ethers.utils.id('CommunityRemoved(address)'),
//             ],
//         ],
//     });

//     const eventsImpactMarket: ethers.utils.LogDescription[] = [];
//     for (let index = 0; index < logsImpactMarket.length; index++) {
//         try {
//             const parsedLog = ifaceImpactMarket.parseLog(
//                 logsImpactMarket[index]
//             );
//             eventsImpactMarket.push(parsedLog);
//         } catch (e) { }
//     }
//     const communitiesAdded: string[] = [];
//     for (let eim = 0; eim < eventsImpactMarket.length; eim += 1) {
//         if (eventsImpactMarket[eim].name === 'CommunityAdded') {
//             communitiesAdded.push(eventsImpactMarket[eim].args._communityAddress);
//         }
//         TransactionsService.add(
//             provider,
//             logsImpactMarket[eim],
//             eventsImpactMarket[eim]
//         ).catch(catchHandlerTransactionsService);
//     }
//     return communitiesAdded;
// }

/**
 * This is a critical method called only once at an important time. This is only used in case
 * there's a complete crash of the api or if some service stops working and
 * @param startFromBlock where to start
 * @param provider json rpc
 * @param availableCommunities all valid communities
 */
async function checkCommunitiesOnChainEvents(
    startFromBlock: number,
    provider: ethers.providers.JsonRpcProvider,
    availableCommunities: Community[]
    // beneficiariesInPublicCommunities: string[]
): Promise<void> {
    const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);
    const ifaceERC20 = new ethers.utils.Interface(ERC20ABI);
    const allCommunitiesAddresses = availableCommunities.map(
        (c) => c.contractAddress
    );
    // const allBeneficiaryAddressses = await BeneficiaryService.getAllAddresses();
    const beneficiariesInPublicCommunities = await BeneficiaryService.getAllAddressesInPublicValidCommunities();
    // get past community events
    for (let c = 0; c < availableCommunities.length; c++) {
        const logsCommunity = await provider.getLogs({
            address: availableCommunities[c].contractAddress!,
            fromBlock: startFromBlock, // community.block !== undefined ? Math.max(community.block, startFromBlock) : 0,
            toBlock: 'latest',
            topics: [
                [
                    ethers.utils.id('ManagerAdded(address)'),
                    ethers.utils.id('ManagerRemoved(address)'),
                    ethers.utils.id('BeneficiaryAdded(address)'),
                    // ethers.utils.id('BeneficiaryLocked(address)'),
                    ethers.utils.id('BeneficiaryRemoved(address)'),
                    ethers.utils.id('BeneficiaryClaim(address,uint256)'),
                    // ethers.utils.id('CommunityEdited(uint256,uint256,uint256,uint256)'),
                ],
            ],
        });

        const orderedLogs = logsCommunity.sort((a, b) => {
            if (a.blockNumber > b.blockNumber) {
                return 1;
            }
            if (a.blockNumber < b.blockNumber) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
        const eventsCommunity = orderedLogs.map((log) =>
            ifaceCommunity.parseLog(log)
        );

        // save community events
        for (let ec = 0; ec < eventsCommunity.length; ec += 1) {
            const log = logsCommunity[ec];
            const parsedLog = eventsCommunity[ec];
            if (parsedLog.name === 'BeneficiaryAdded') {
                const beneficiaryAddress = parsedLog.args[0];
                const communityAddress = log.address;
                // let communityId = allCommunities.get(communityAddress);
                // notifyBeneficiaryAdded(beneficiaryAddress, communityAddress);
                const isPublicCommunity = availableCommunities.find(
                    (c) => c.contractAddress === communityAddress
                );
                if (isPublicCommunity?.visibility === 'public') {
                    beneficiariesInPublicCommunities.push(beneficiaryAddress);
                }
                const txAt = await getBlockTime(log.blockHash);
                await BeneficiaryService.add(
                    beneficiaryAddress,
                    availableCommunities[c].publicId,
                    log.transactionHash,
                    txAt
                );
            } else if (parsedLog.name === 'BeneficiaryRemoved') {
                const beneficiaryAddress = parsedLog.args[0];
                await BeneficiaryService.remove(beneficiaryAddress);
            } else if (parsedLog.name === 'BeneficiaryClaim') {
                const beneficiaryAddress = parsedLog.args[0];
                const amount = parsedLog.args[1];
                // const communityId = allCommunities.get(log.address)!;
                const txAt = await getBlockTime(log.blockHash);
                await ClaimsService.add(
                    beneficiaryAddress,
                    availableCommunities[c].publicId,
                    amount,
                    log.transactionHash,
                    txAt
                );
            } else if (parsedLog.name === 'ManagerAdded') {
                const managerAddress = parsedLog.args[0];
                await ManagerService.add(
                    managerAddress,
                    availableCommunities[c].publicId
                );
            } else if (parsedLog.name === 'ManagerRemoved') {
                const managerAddress = parsedLog.args[0];
                await ManagerService.remove(
                    managerAddress,
                    availableCommunities[c].publicId
                );
            }
            TransactionsService.add(
                provider,
                logsCommunity[ec],
                eventsCommunity[ec]
            ).catch(catchHandlerTransactionsService);
        }
        // get past donations
        const logsCUSD = await provider.getLogs({
            fromBlock: startFromBlock, // community.block !== undefined ? Math.max(community.block, startFromBlock) : 0,
            toBlock: 'latest',
            topics: [[ethers.utils.id('Transfer(address,address,uint256)')]],
        });
        const eventsCUSD = logsCUSD.map((log) => ifaceERC20.parseLog(log));
        for (let ec = 0; ec < eventsCUSD.length; ec += 1) {
            const preParsedLog = eventsCUSD[ec];
            if (
                eventsCUSD[ec].args.to ===
                availableCommunities[c].contractAddress
            ) {
                const log = logsCUSD[ec];
                const parsedLog = eventsCUSD[ec];
                const from = parsedLog.args[0];
                // const toCommunityAddress = parsedLog.args[1];
                // const communityId = allCommunities.get(toCommunityAddress)!;
                const amount = parsedLog.args[2].toString();
                const txAt = await getBlockTime(log.blockHash);
                await InflowService.add(
                    from,
                    availableCommunities[c].publicId,
                    amount,
                    log.transactionHash,
                    txAt
                );
                TransactionsService.add(
                    provider,
                    logsCUSD[ec],
                    eventsCUSD[ec]
                ).catch(catchHandlerTransactionsService);
            } else if (
                // same as in subscribe
                !allCommunitiesAddresses.includes(preParsedLog.args[0]) &&
                (beneficiariesInPublicCommunities.includes(
                    preParsedLog.args[0]
                ) ||
                    beneficiariesInPublicCommunities.includes(
                        preParsedLog.args[1]
                    )) &&
                preParsedLog.args[1] !== config.attestationProxyAddress &&
                preParsedLog.args[0] !== preParsedLog.args[1] &&
                preParsedLog.args[2].toString().length > 15
            ) {
                const isFromBeneficiary = beneficiariesInPublicCommunities.includes(
                    preParsedLog.args[0]
                );
                // transactions from or to beneficiaries
                if (
                    isFromBeneficiary ||
                    beneficiariesInPublicCommunities.includes(
                        preParsedLog.args[1]
                    )
                ) {
                    const log = logsCUSD[ec];
                    const _parsedLog = preParsedLog; // TODO: rename to parsedLog
                    const beneficiaryAddress = isFromBeneficiary
                        ? _parsedLog.args[0]
                        : _parsedLog.args[1];
                    const withAddress = isFromBeneficiary
                        ? _parsedLog.args[1]
                        : _parsedLog.args[0];
                    // save to table to calculate txs and volume
                    await BeneficiaryTransactionService.add({
                        beneficiary: beneficiaryAddress,
                        withAddress,
                        amount: _parsedLog.args[2].toString(),
                        isFromBeneficiary,
                        tx: log.transactionHash,
                        date: new Date(),
                    });
                }
            }
        }
    }
}

export {
    subscribeChainEvents,
    /** updateImpactMarketCache, */ checkCommunitiesOnChainEvents,
};
