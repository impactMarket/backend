import { ethers } from 'ethers';
import ImpactMarketContractABI from '../contracts/ImpactMarketABI.json'
import CommunityContractABI from '../contracts/CommunityABI.json'
import ERC20ABI from '../contracts/ERC20ABI.json'
import TransactionsService from '../services/transactions';
import { BigNumber } from 'ethers/utils';
import config from '../config';
import { Community } from '../models/community';


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
) {
    // get the last transaction cached
    const lastEntry = await TransactionsService.getLastEntry();
    if (lastEntry === undefined) {
        return defaultStart;
    }
    const block = await provider.getTransactionReceipt(lastEntry.tx);
    return block.blockNumber !== undefined ? block.blockNumber : defaultStart;
}

interface ICommunityAddedEventValues {
    _addr: string,
    _firstCoordinator: string,
    _amountByClaim: BigNumber,
    _baseIntervalTime: BigNumber,
    _incIntervalTime: BigNumber,
    _claimHardCap: BigNumber,
}
interface IBeneficiaryClaimEventValues {
    _account: string,
    _amount: BigNumber,
}
interface ITransferEventValues {
    from: string,
    to: string,
    value: BigNumber,
}

function translateEvent(
    rawValues: ICommunityAddedEventValues | IBeneficiaryClaimEventValues | ITransferEventValues | { _account: string },
) {
    if ((rawValues as ICommunityAddedEventValues)._baseIntervalTime) {
        const values = rawValues as ICommunityAddedEventValues;
        return {
            _communityAddress: values._addr,
            _firstCoordinator: values._firstCoordinator,
            _amountByClaim: values._amountByClaim.toString(),
            _baseIntervalTime: values._baseIntervalTime.toString(),
            _incIntervalTime: values._incIntervalTime.toString(),
            _claimHardCap: values._claimHardCap.toString(),
        }
    }
    else if ((rawValues as ITransferEventValues).from) {
        const values = rawValues as ITransferEventValues;
        return {
            from: values.from,
            to: values.to,
            value: values.value.toString(),
        }
    }
    else if ((rawValues as IBeneficiaryClaimEventValues)._amount) {
        const values = rawValues as IBeneficiaryClaimEventValues;
        return {
            _account: values._account,
            _amount: values._amount.toString(),
        }
    }
    // everything else
    const values = rawValues as { _account: string };
    return {
        _account: values._account,
    }
}

async function subscribeChainEvents(
    provider: ethers.providers.JsonRpcProvider,
    communitiesAddress: string[],
) {
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
    const addToTransactionCache = async (event: any) => TransactionsService.add(
        event.transactionHash,
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
        communityInstance.on('CoordinatorAdded', (_account, event) => addToTransactionCache(event));
        communityInstance.on('CoordinatorRemoved', (_account, event) => addToTransactionCache(event));
        communityInstance.on('BeneficiaryAdded', (_account, event) => addToTransactionCache(event));
        communityInstance.on('BeneficiaryLocked', (_account, event) => addToTransactionCache(event));
        communityInstance.on('BeneficiaryRemoved', (_account, event) => addToTransactionCache(event));
        communityInstance.on('BeneficiaryClaim', (_account, _amount, event) => addToTransactionCache(event));
        // also listen to donations
        cUSDMockInstance.on(
            cUSDMockInstance.filters.Transfer(null, communityAddress),
            (from, to, value, event) => addToTransactionCache(event));
    }
    // listen to impact market events
    impactMarketInstance.on('CommunityAdded', async (
        _addr, _firstCoordinator, _amountByClaim, _baseIntervalTime, _incIntervalTime, _claimHardCap, event
    ) => {
        addToTransactionCache(event);
        communitiesCallbackFn(_addr);
    });
    impactMarketInstance.on('CommunityRemoved', async (_addr, event) => addToTransactionCache(event));

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
                address: eventsImpactMarket[eim].values._addr,
                block: logsImpactMarket[eim].blockNumber,
            });
        }
        TransactionsService.add(
            logsImpactMarket[eim].transactionHash!,
            (await provider.getTransactionReceipt(logsImpactMarket[eim].transactionHash!)).from!,
            logsImpactMarket[eim].address,
            eventsImpactMarket[eim].name,
            translateEvent(eventsImpactMarket[eim].values),
        ).catch(catchHandlerTransactionsService)
    }
    return communitiesAdded;
}

async function updateCommunityCache(
    startFromBlock: number,
    provider: ethers.providers.JsonRpcProvider,
    contractAddress: string,
) {
    const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);
    const ifaceERC20 = new ethers.utils.Interface(ERC20ABI);
    // get past community events
    provider.getLogs({
        address: contractAddress,
        fromBlock: startFromBlock, // community.block !== undefined ? Math.max(community.block, startFromBlock) : 0,
        toBlock: 'latest',
        topics: [[
            ethers.utils.id('CoordinatorAdded(address)'),
            ethers.utils.id('CoordinatorRemoved(address)'),
            ethers.utils.id('BeneficiaryAdded(address)'),
            ethers.utils.id('BeneficiaryLocked(address)'),
            ethers.utils.id('BeneficiaryRemoved(address)'),
            ethers.utils.id('BeneficiaryClaim(address,uint256)'),
        ]]
    }).then(async (logsCommunity) => {
        const eventsCommunity = logsCommunity.map((log) => ifaceCommunity.parseLog(log));
        // save community events
        for (let ec = 0; ec < eventsCommunity.length; ec += 1) {
            TransactionsService.add(
                logsCommunity[ec].transactionHash!,
                (await provider.getTransactionReceipt(logsCommunity[ec].transactionHash!)).from!,
                logsCommunity[ec].address,
                eventsCommunity[ec].name,
                translateEvent(eventsCommunity[ec].values),
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
                    logsCUSD[ec].transactionHash!,
                    (await provider.getTransactionReceipt(logsCUSD[ec].transactionHash!)).from!,
                    logsCUSD[ec].address,
                    eventsCUSD[ec].name,
                    translateEvent(eventsCUSD[ec].values),
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