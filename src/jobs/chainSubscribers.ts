import { ethers } from 'ethers';
import ImpactMarketContractABI from '../contracts/ImpactMarketABI.json'
import CommunityContractABI from '../contracts/CommunityABI.json'
import ERC20ABI from '../contracts/ERC20ABI.json'
import TransactionsService from '../services/transactions';
import config from '../config';
import { notifyBeneficiaryAdded } from '../utils';
import CommunityService from '../services/community';
import Logger from '../loaders/logger';
import ImMetadataService from '../services/imMetadata';
import BeneficiaryService from '../services/beneficiary';
import ManagerService from '../services/managers';
import ClaimsService from '../services/claims';
import InflowService from '../services/inflow';


interface IFilterCommunityTmpData {
    address: string;
    block?: number;
}

function catchHandlerTransactionsService(error: any) {
    // that's fine if it is a SequelizeUniqueConstraintError
    // it's already there 👌
    if (error.name !== 'SequelizeUniqueConstraintError') {
        Logger.warning(typeof error, error, ':18');
    }
}

async function subscribeChainEvents(
    provider: ethers.providers.JsonRpcProvider,
    communities: Map<string, string>,
): Promise<void> {
    const filter = {
        topics: [[
            // ethers.utils.id('CommunityAdded(address,address,uint256,uint256,uint256,uint256)'),
            // ethers.utils.id('CommunityRemoved(address)'),
            ethers.utils.id('ManagerAdded(address)'),
            // ethers.utils.id('ManagerRemoved(address)'),
            ethers.utils.id('BeneficiaryAdded(address)'),
            // ethers.utils.id('BeneficiaryLocked(address)'),
            ethers.utils.id('BeneficiaryRemoved(address)'),
            ethers.utils.id('BeneficiaryClaim(address,uint256)'),
            // ethers.utils.id('CommunityEdited(uint256,uint256,uint256,uint256)'),
            ethers.utils.id('Transfer(address,address,uint256)'),
        ]]
    };
    // const ifaceImpactMarket = new ethers.utils.Interface(ImpactMarketContractABI);
    const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);
    const ifaceERC20 = new ethers.utils.Interface(ERC20ABI);
    const allCommunitiesAddresses = Array.from(communities.keys());
    const allCommunities = communities;
    provider.on(filter, async (log: ethers.providers.Log) => {
        let parsedLog: ethers.utils.LogDescription | undefined;
        // if (log.address === config.impactMarketContractAddress) {
        //     parsedLog = ifaceImpactMarket.parseLog(log);
        //     if (parsedLog.name === 'CommunityAdded') {
        //         console.log('CommunityAdded')
        //         // it's necessary to get ManagerAdded here!
        //         // TODO: is this necessary here?
        //         updateCommunityCache(log.blockNumber - 1, provider, parsedLog.args[0]);
        //         allCommunitiesAddresses.push(parsedLog.args[0]);
        //         const community = await CommunityService.findByContractAddress(parsedLog.args[0]);
        //         if (community !== null) {
        //             allCommunities.set(parsedLog.args[0], community.publicId);
        //         }
        //     }
        //     //
        // } else
        if (log.address === config.cUSDContractAddress) {
            const preParsedLog = ifaceERC20.parseLog(log);
            // only transactions to community contracts
            if (allCommunitiesAddresses.includes(preParsedLog.args[1])) {
                parsedLog = preParsedLog;
                const from = parsedLog.args[0];
                const toCommunityAddress = parsedLog.args[1];
                const communityPublicId = allCommunities.get(toCommunityAddress)!;
                const amount = parsedLog.args[2];
                InflowService.add(
                    from,
                    communityPublicId,
                    amount,
                    log.transactionHash
                );
            }
            //
        } else if (allCommunitiesAddresses.includes(log.address)) {
            parsedLog = ifaceCommunity.parseLog(log);
            if (parsedLog.name === 'BeneficiaryAdded') {
                const beneficiaryAddress = parsedLog.args[0];
                const communityAddress = log.address;
                let communityPublicId = allCommunities.get(communityAddress);
                if (communityPublicId === undefined) {
                    // if for some reson (it shouldn't, might mean serious problems 😬), this is undefined
                    const community = (await CommunityService.findByContractAddress(communityAddress))!;
                    allCommunities.set(communityAddress, community.publicId);
                    communityPublicId = community.publicId;
                }
                notifyBeneficiaryAdded(beneficiaryAddress, communityAddress);
                BeneficiaryService.add(beneficiaryAddress, communityPublicId);
            } else if (parsedLog.name === 'BeneficiaryRemoved') {
                const beneficiaryAddress = parsedLog.args[0];
                BeneficiaryService.remove(beneficiaryAddress);
            } else if (parsedLog.name === 'BeneficiaryClaim') {
                const beneficiaryAddress = parsedLog.args[0];
                const amount = parsedLog.args[1];
                const communityPublicId = allCommunities.get(log.address)!;
                ClaimsService.add(
                    beneficiaryAddress,
                    communityPublicId,
                    amount,
                    log.transactionHash
                );
            }
        } else {
            try {
                parsedLog = ifaceCommunity.parseLog(log);
                if (parsedLog.name === 'ManagerAdded') {
                    const managerAddress = parsedLog.args[0];
                    const communityAddress = log.address;
                    if (allCommunitiesAddresses.includes(communityAddress)) {
                        ManagerService.add(managerAddress, allCommunities.get(communityAddress)!);
                    } else {
                        const communityAddressesAndIds = await CommunityService.getAllAddressesAndIds();
                        if (Array.from(communityAddressesAndIds.keys()).includes(communityAddress)) {
                            // in case new manager means new community
                            const communityId = communityAddressesAndIds.get(communityAddress)!;
                            ManagerService.add(managerAddress, communityId);
                            allCommunities.set(communityAddress, communityId);
                            allCommunitiesAddresses.push(communityAddress);
                        } else {
                            // if for some reason (mainly timing), the community wasn't in the database, try again in 4 secs
                            const cancelTimeout = setInterval(async (_managerAddress: string, _communityAddress: string) => {
                                Logger.warn(`Community ${_communityAddress} was not in the database when "ManagerAdded".`);
                                const communityAddressesAndIds = await CommunityService.getAllAddressesAndIds();
                                if (Array.from(communityAddressesAndIds.keys()).includes(_communityAddress) && !allCommunitiesAddresses.includes(_communityAddress)) {
                                    // new private community (are events from public one getting here?)
                                    const communityId = communityAddressesAndIds.get(communityAddress)!;
                                    ManagerService.add(_managerAddress, communityId);
                                    allCommunities.set(_communityAddress, communityId);
                                    allCommunitiesAddresses.push(_communityAddress);
                                    clearInterval(cancelTimeout);
                                }
                            }, 4000, managerAddress, communityAddress);
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
            TransactionsService.add(
                provider,
                log,
                parsedLog,
            ).catch(catchHandlerTransactionsService)
        }
        ImMetadataService.setLastBlock(log.blockNumber);
    });
}

async function updateImpactMarketCache(
    provider: ethers.providers.JsonRpcProvider,
    startFromBlock: number,
): Promise<IFilterCommunityTmpData[]> {
    const ifaceImpactMarket = new ethers.utils.Interface(ImpactMarketContractABI);

    const logsImpactMarket = await provider.getLogs({
        address: config.impactMarketContractAddress,
        fromBlock: startFromBlock,
        toBlock: 'latest',
        topics: [[
            ethers.utils.id('CommunityAdded(address,address,uint256,uint256,uint256,uint256)'),
            ethers.utils.id('CommunityRemoved(address)'),
        ]]
    });

    const eventsImpactMarket: ethers.utils.LogDescription[] = [];
    for (let index = 0; index < logsImpactMarket.length; index++) {
        try {
            const parsedLog = ifaceImpactMarket.parseLog(logsImpactMarket[index]);
            eventsImpactMarket.push(parsedLog);
        } catch (e) { }
    }
    const communitiesAdded = [] as IFilterCommunityTmpData[];
    for (let eim = 0; eim < eventsImpactMarket.length; eim += 1) {
        if (eventsImpactMarket[eim].name === 'CommunityAdded') {
            communitiesAdded.push({
                address: eventsImpactMarket[eim].args._communityAddress,
                block: logsImpactMarket[eim].blockNumber,
            });
        }
        TransactionsService.add(
            provider,
            logsImpactMarket[eim],
            eventsImpactMarket[eim],
        ).catch(catchHandlerTransactionsService)
    }
    return communitiesAdded;
}

function updateCommunityCache(
    startFromBlock: number,
    provider: ethers.providers.JsonRpcProvider,
    contractAddress: string,
): void {
    const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);
    const ifaceERC20 = new ethers.utils.Interface(ERC20ABI);
    // get past community events
    provider.getLogs({
        address: contractAddress,
        fromBlock: startFromBlock, // community.block !== undefined ? Math.max(community.block, startFromBlock) : 0,
        toBlock: 'latest',
        topics: [[
            ethers.utils.id('ManagerAdded(address)'),
            ethers.utils.id('ManagerRemoved(address)'),
            ethers.utils.id('BeneficiaryAdded(address)'),
            ethers.utils.id('BeneficiaryLocked(address)'),
            ethers.utils.id('BeneficiaryRemoved(address)'),
            ethers.utils.id('BeneficiaryClaim(address,uint256)'),
            ethers.utils.id('CommunityEdited(uint256,uint256,uint256,uint256)'),
        ]]
    }).then(async (logsCommunity) => {
        const eventsCommunity = logsCommunity.map((log) => ifaceCommunity.parseLog(log));
        // save community events
        for (let ec = 0; ec < eventsCommunity.length; ec += 1) {
            TransactionsService.add(
                provider,
                logsCommunity[ec],
                eventsCommunity[ec],
            ).catch(catchHandlerTransactionsService)
        }
    });
    // get past donations
    provider.getLogs({
        fromBlock: startFromBlock, // community.block !== undefined ? Math.max(community.block, startFromBlock) : 0,
        toBlock: 'latest',
        topics: [[
            ethers.utils.id('Transfer(address,address,uint256)'),
        ]]
    }).then(async (logsCUSD) => {
        const eventsCUSD = logsCUSD.map((log) => ifaceERC20.parseLog(log));
        for (let ec = 0; ec < eventsCUSD.length; ec += 1) {
            if (eventsCUSD[ec].args.to === contractAddress) {
                TransactionsService.add(
                    provider,
                    logsCUSD[ec],
                    eventsCUSD[ec],
                ).catch(catchHandlerTransactionsService)
            }
        }
    });
}

export {
    subscribeChainEvents,
    updateImpactMarketCache,
    updateCommunityCache,
}