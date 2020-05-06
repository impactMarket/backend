import {
    UpdateImpactMarketCache,
    UpdateCommunityCache,
} from '../subscribers';


export default async (): Promise<void> => {
    const availableCommunities = await UpdateImpactMarketCache();
    availableCommunities.forEach((community) => UpdateCommunityCache(community));
};