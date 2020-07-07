import { ethers } from 'ethers';
import ImpactMarketContractABI from '../contracts/ImpactMarketABI.json'
import CommunityContractABI from '../contracts/CommunityABI.json'
import ERC20ABI from '../contracts/ERC20ABI.json'
import TransactionsService, { translateEvent } from '../db/services/transactions';
import config from '../config';


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
    const impactMarketInstance = new ethers.Contract(
        config.impactMarketContractAddress,
        ImpactMarketContractABI,
        provider,
    );
    /**
     * here, the event has the following structure
     * https://docs.ethers.io/ethers.js/html/api-contract.html#event-object
     * the parameters are necessary
     */
    const addToTransactionCache = async (event: any) => TransactionsService.addRaw(
        event.transactionHash,
        new Date(),
        (await provider.getTransactionReceipt(event.transactionHash!)).from!,
        event.address,
        event.event,
        translateEvent(event.args),
    ).catch(catchHandlerTransactionsService);
    // callback function
    const communitiesCallbackFn = (communityAddress: string) => {
        const communityInstance = new ethers.Contract(
            communityAddress,
            CommunityContractABI,
            provider,
        );
        // TODO: add notifications to all events
        communityInstance.on('ManagerAdded', (_account, event) => addToTransactionCache(event));
        communityInstance.on('ManagerRemoved', (_account, event) => addToTransactionCache(event));
        communityInstance.on('BeneficiaryAdded', (_account, event) => addToTransactionCache(event));
        communityInstance.on('BeneficiaryLocked', (_account, event) => addToTransactionCache(event));
        communityInstance.on('BeneficiaryRemoved', (_account, event) => addToTransactionCache(event));
        communityInstance.on('BeneficiaryClaim', (_account, _amount, event) => addToTransactionCache(event));
        communityInstance.on('CommunityEdited',
            (_claimAmount, _maxClaim, _baseInterval, _incrementInterval, event) => addToTransactionCache(event));
        // also listen to donations
        cUSDMockInstance.on(
            cUSDMockInstance.filters.Transfer(null, communityAddress),
            (from, to, value, event) => addToTransactionCache(event));
    }
    // listen to impact market events
    impactMarketInstance.on('CommunityAdded', async (
        _communityAddress, _firstManager, _claimAmount, _maxClaim, _baseInterval, _incrementInterval, event
    ) => {
        addToTransactionCache(event);
        // it's necessary to get ManagerAdded here!
        updateCommunityCache(event.blockNumber - 1, provider, _communityAddress);
        communitiesCallbackFn(_communityAddress);
    });
    impactMarketInstance.on('CommunityRemoved', async (_communityAddress, event) => addToTransactionCache(event));

    const cUSDMockInstance = new ethers.Contract(
        config.cUSDContractAddress,
        ERC20ABI,
        provider,
    );
    // listen to community events individually
    communitiesAddress.forEach(communitiesCallbackFn);
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
    const eventsImpactMarket = logsImpactMarket.map((log) => ifaceImpactMarket.parseLog(log));
    const communitiesAdded = [] as IFilterCommunityTmpData[];
    for (let eim = 0; eim < eventsImpactMarket.length; eim += 1) {
        if (eventsImpactMarket[eim].name === 'CommunityAdded') {
            communitiesAdded.push({
                address: eventsImpactMarket[eim].values._communityAddress,
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
            if (eventsCUSD[ec].values.to === contractAddress) {
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