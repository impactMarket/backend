import {
    UpdateImpactMarketCache,
    UpdateCommunityCache,
    SubscribeChainEvents,
} from '../subscribers';


export default async (): Promise<void> => {
    const availableCommunities = await UpdateImpactMarketCache();
    availableCommunities.forEach((community) => UpdateCommunityCache(community));
    SubscribeChainEvents(availableCommunities);
};