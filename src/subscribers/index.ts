import { ethers } from 'ethers';
import config from '../config';

import ImpactMarketContractABI from '../contracts/ImpactMarketABI.json'
import CommunityContractABI from '../contracts/CommunityABI.json'
import ContractAddresses from '../contracts/network.json';
import TransactionsService from '../services/transactions';


async function SubscribeChainEvents(
    communityAddresses: string[],
) {
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    const impactMarketInstance = new ethers.Contract(
        ContractAddresses.alfajores.ImpactMarket,
        ImpactMarketContractABI,
        provider,
    );
    impactMarketInstance.on('CommunityAdded', (newCommunityAddress, event) => {
        console.log(newCommunityAddress, event);
    });
    // TODO: add CommunityRemoved
    communityAddresses.forEach((communityAddress) => {
        const communityInstance = new ethers.Contract(
            communityAddress,
            CommunityContractABI,
            provider,
        );
        communityInstance.on('BeneficiaryAdded', (beneficiaryAddress, event) => {
            console.log(beneficiaryAddress, event);
        });
        // TODO: add BeneficiaryRemoved, BeneficiaryClaim
    });
}

async function UpdateImpactMarketCache(): Promise<string[]> {
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    const ifaceImpactMarket = new ethers.utils.Interface(ImpactMarketContractABI);

    const logsImpactMarket = await provider.getLogs({
        address: ContractAddresses.alfajores.ImpactMarket,
        fromBlock: 0, // TODO: get block number where it gets deployed
        toBlock: 'latest',
        topics: [
            ethers.utils.id('CommunityAdded(address)'),
            // ethers.utils.id('CommunityRemoved(address)'),
        ]
    });
    const eventsImpactMarket = logsImpactMarket.map((log) => ifaceImpactMarket.parseLog(log));
    const communitiesAdded = [] as string[];
    for (let eim = 0; eim < eventsImpactMarket.length; eim += 1) {
        if (eventsImpactMarket[eim].name === 'CommunityAdded') {
            communitiesAdded.push(eventsImpactMarket[eim].values._addr);
        }
        // TODO: also add remove and filter the added and removed
        TransactionsService.add(
            logsImpactMarket[eim].transactionHash!,
            (await provider.getTransactionReceipt(logsImpactMarket[eim].transactionHash!)).from!,
            logsImpactMarket[eim].address,
            eventsImpactMarket[eim].name,
            eventsImpactMarket[eim].values,
        ).catch((error) => {
            // that's fine if it is a SequelizeUniqueConstraintError
            // it's already there 👌
            if (error.name !== 'SequelizeUniqueConstraintError') {
                console.log(typeof error, error);
            }
        })
    }
    return communitiesAdded;
}

async function UpdateCommunityCache(
    communityAddress: string,
) {
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);

    provider.getLogs({
        address: communityAddress,
        fromBlock: 0, // TODO: get block number where it gets deployed
        toBlock: 'latest',
        topics: [
            ethers.utils.id('BeneficiaryAdded(address)'),
            // ethers.utils.id('BeneficiaryRemoved(address)'),
            // ethers.utils.id('BeneficiaryClaim(address,uint256)'),
        ]
    }).then(async (logsCommunity) => {
        const eventsCommunity = logsCommunity.map((log) => ifaceCommunity.parseLog(log));
        // save community events
        for (let ec = 0; ec < eventsCommunity.length; ec += 1) {
            TransactionsService.add(
                logsCommunity[ec].transactionHash!,
                (await provider.getTransactionReceipt(logsCommunity[ec].transactionHash!)).from!,
                logsCommunity[ec].address,
                eventsCommunity[ec].name,
                eventsCommunity[ec].values,
            ).catch((error) => {
                // that's fine if it is a SequelizeUniqueConstraintError
                // it's already there 👌
                if (error.name !== 'SequelizeUniqueConstraintError') {
                    console.log(typeof error, error);
                }
            })
        }
    });
}

export {
    SubscribeChainEvents,
    UpdateImpactMarketCache,
    UpdateCommunityCache,
}