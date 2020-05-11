import {
    updateImpactMarketCache,
    updateCommunityCache,
    subscribeChainEvents,
    startFromBlock,
} from '../subscribers';
import Network from '../contracts/network.json';
import config from '../config';
import { ethers } from 'ethers';


export default async (): Promise<void> => {
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    const startFrom = await startFromBlock(provider, Network.alfajores.blockNumber);
    const availableCommunities = await updateImpactMarketCache(provider, startFrom);
    // Because we are filtering events by address
    // when the community is created, the first coordinator
    // is actually added by impactmarket in an internal transaction.
    // This means that it's necessary to filter CoordinatorAdded with
    // impactmarket address.
    updateCommunityCache(startFrom, provider, { address: Network.alfajores.ImpactMarket });
    availableCommunities.forEach((community) => updateCommunityCache(startFrom, provider, community));
    subscribeChainEvents(provider, availableCommunities);
};