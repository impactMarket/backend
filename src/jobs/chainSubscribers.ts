import { ethers } from 'ethers';
import ImpactMarketContractABI from '../contracts/ImpactMarketABI.json'
import CommunityContractABI from '../contracts/CommunityABI.json'
import ERC20ABI from '../contracts/ERC20ABI.json'
import TransactionsService from '../db/services/transactions';
import config from '../config';
import { sendPushNotification } from '../utils';


interface IFilterCommunityTmpData {
    address: string;
    block?: number;
}

function catchHandlerTransactionsService(error: any) {
    // that's fine if it is a SequelizeUniqueConstraintError
    // it's already there 👌
    if (error.name !== 'SequelizeUniqueConstraintError') {
        console.log(typeof error, error, ':18');
    }
}

async function startFromBlock(
    provider: ethers.providers.JsonRpcProvider,
    defaultStart: number,
): Promise<number> {
    // get the last transaction cached
    const lastEntry = await TransactionsService.getLastEntry();
    if (lastEntry === undefined) {
        return defaultStart;
    }
    const block = await provider.getTransactionReceipt(lastEntry.tx);
    return block.blockNumber !== undefined ? block.blockNumber : defaultStart;
}

async function subscribeChainEvents(
    provider: ethers.providers.JsonRpcProvider,
    communitiesAddress: string[],
): Promise<void> {
    const filter = {
        topics: [[
            ethers.utils.id('CommunityAdded(address,address,uint256,uint256,uint256,uint256)'),
            ethers.utils.id('CommunityRemoved(address)'),
            ethers.utils.id('ManagerAdded(address)'),
            ethers.utils.id('ManagerRemoved(address)'),
            ethers.utils.id('BeneficiaryAdded(address)'),
            ethers.utils.id('BeneficiaryLocked(address)'),
            ethers.utils.id('BeneficiaryRemoved(address)'),
            ethers.utils.id('BeneficiaryClaim(address,uint256)'),
            ethers.utils.id('CommunityEdited(uint256,uint256,uint256,uint256)'),
            ethers.utils.id('Transfer(address,address,uint256)'),
        ]]
    };
    const ifaceImpactMarket = new ethers.utils.Interface(ImpactMarketContractABI);
    const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);
    const ifaceERC20 = new ethers.utils.Interface(ERC20ABI);
    const allCommunitiesAddresses = communitiesAddress;
    provider.on(filter, (log: ethers.providers.Log) => {
        let parsedLog: ethers.utils.LogDescription | undefined;
        if (log.address === config.impactMarketContractAddress) {
            parsedLog = ifaceImpactMarket.parseLog(log);
            if (parsedLog.name === 'CommunityAdded') {
                // it's necessary to get ManagerAdded here!
                updateCommunityCache(log.blockNumber - 1, provider, parsedLog.args[0]);
                allCommunitiesAddresses.push(parsedLog.args[0]);
            }
            //
        } else if (log.address === config.cUSDContractAddress) {
            const preParsedLog = ifaceERC20.parseLog(log);
            // only donations
            if (allCommunitiesAddresses.includes(preParsedLog.args[1])) {
                parsedLog = preParsedLog;
            }
            //
        } else if (allCommunitiesAddresses.includes(log.address)) {
            parsedLog = ifaceCommunity.parseLog(log);
            if (parsedLog.name === 'BeneficiaryAdded') {
                sendPushNotification(parsedLog.args[0], 'Welcome', 'You\'ve been added as a beneficiary!', { action: "beneficiary-added" });
            }
        }
        if (parsedLog !== undefined) {
            TransactionsService.add(
                provider,
                log,
                parsedLog,
            ).catch(catchHandlerTransactionsService)
        }
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
    startFromBlock,
    subscribeChainEvents,
    updateImpactMarketCache,
    updateCommunityCache,
}