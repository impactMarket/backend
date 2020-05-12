import {
    updateImpactMarketCache,
    updateCommunityCache,
    subscribeChainEvents,
    startFromBlock,
} from '../subscribers';
import config from '../config';
import { ethers } from 'ethers';


export default async (): Promise<void> => {
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    const startFrom = await startFromBlock(provider, config.impactMarketContractBlockNumber);
    const availableCommunities = await updateImpactMarketCache(provider, startFrom);
    // Because we are filtering events by address
    // when the community is created, the first coordinator
    // is actually added by impactmarket in an internal transaction.
    // This means that it's necessary to filter CoordinatorAdded with
    // impactmarket address.
    updateCommunityCache(startFrom, provider, { address: config.impactMarketContractAddress });
    availableCommunities.forEach((community) => updateCommunityCache(startFrom, provider, community));
    subscribeChainEvents(provider, availableCommunities);
};