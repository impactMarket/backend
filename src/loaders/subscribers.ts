import {
    updateImpactMarketCache,
    updateCommunityCache,
    subscribeChainEvents,
    startFromBlock,
} from '../subscribers';
import config from '../config';
import { ethers } from 'ethers';
import CommunityService from '../services/community';


export default async (): Promise<void> => {
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    const startFrom = await startFromBlock(provider, config.impactMarketContractBlockNumber);
    const fromLogs = await updateImpactMarketCache(provider, startFrom);
    fromLogs.forEach((community) => updateCommunityCache(
        community.block === undefined
            ? startFrom
            : community.block,
        provider,
        community.address
    ));
    // Because we are filtering events by address
    // when the community is created, the first coordinator
    // is actually added by impactmarket in an internal transaction.
    // This means that it's necessary to filter CoordinatorAdded with
    // impactmarket address.
    updateCommunityCache(startFrom, provider, config.impactMarketContractAddress);
    const availableCommunities = await CommunityService.getAll('valid');
    availableCommunities.forEach((community) => updateCommunityCache(startFrom, provider, community.contractAddress));
    subscribeChainEvents(provider, availableCommunities.map((community) => community.contractAddress));
};