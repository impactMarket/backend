import { ethers } from 'ethers';
import ImpactMarketContractABI from '../contracts/ImpactMarketABI.json'
import CommunityContractABI from '../contracts/CommunityABI.json'
import Network from '../contracts/network.json';
import TransactionsService from '../services/transactions';
import { BigNumber } from 'ethers/utils';


interface IFilterCommunityTmpData {
    address: string;
    block?: number;
}

function catchHandlerTransactionsService(error: any) {
    // that's fine if it is a SequelizeUniqueConstraintError
    // it's already there 👌
    if (error.name !== 'SequelizeUniqueConstraintError') {
        console.log(typeof error, error);
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

function translateEvent(
    rawValues: ICommunityAddedEventValues | IBeneficiaryClaimEventValues | { _account: string },
) {
    if ((rawValues as ICommunityAddedEventValues)._baseIntervalTime) {
        const values = rawValues as ICommunityAddedEventValues;
        return {
            _communityAddress: values._addr,
            _firstCoordinator: values._firstCoordinator,
            _amountByClaim: values._amountByClaim,
            _baseIntervalTime: values._baseIntervalTime.toString(),
            _incIntervalTime: values._incIntervalTime.toString(),
            _claimHardCap: values._claimHardCap.toString(),
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
    communities: IFilterCommunityTmpData[],
) {
    const impactMarketInstance = new ethers.Contract(
        Network.alfajores.ImpactMarket,
        ImpactMarketContractABI,
        provider,
    );
    impactMarketInstance.on('CommunityAdded', async (event) => {
        TransactionsService.add(
            event.transactionHash,
            (await provider.getTransactionReceipt(event.transactionHash!)).from!,
            event.address,
            event.event,
            translateEvent(event.args),
        ).catch(catchHandlerTransactionsService)
    });
    // TODO: add CommunityRemoved
    communities.forEach((community) => {
        const communityInstance = new ethers.Contract(
            community.address,
            CommunityContractABI,
            provider,
        );
        communityInstance.on('BeneficiaryAdded', (beneficiaryAddress, event) => {
            console.log(beneficiaryAddress, event);
        });
        // TODO: add BeneficiaryRemoved, BeneficiaryClaim
    });
}

async function updateImpactMarketCache(
    provider: ethers.providers.JsonRpcProvider,
    startFromBlock: number,
): Promise<IFilterCommunityTmpData[]> {
    const ifaceImpactMarket = new ethers.utils.Interface(ImpactMarketContractABI);

    const logsImpactMarket = await provider.getLogs({
        address: Network.alfajores.ImpactMarket,
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
    community: IFilterCommunityTmpData,
) {
    const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);

    provider.getLogs({
        address: community.address,
        fromBlock: community.block !== undefined ? Math.max(community.block, startFromBlock) : 0,
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
}

export {
    startFromBlock,
    subscribeChainEvents,
    updateImpactMarketCache,
    updateCommunityCache,
}