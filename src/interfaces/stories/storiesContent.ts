import { StoriesCommunityCreationEager } from './storiesCommunity';
import { StoriesEngagementCreation } from './storiesEngagement';

export interface StoriesContent {
    id: number;
    media?: number;
    message?: number;
    postedAt: Date;
}

export interface StoriesContentCreation {
    postedAt: Date;
    StoriesCommunityModel?: StoriesCommunityCreationEager[];
    StoriesEngagementModel?: StoriesEngagementCreation[];
}
