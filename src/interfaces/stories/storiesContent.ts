import { StoriesCommunityCreationEager } from './storiesCommunity';
import {
    StoriesEngagement,
    StoriesEngagementCreation,
} from './storiesEngagement';

export interface StoriesContent {
    id: number;
    media: string | null;
    message: string | null;
    byAddress: string;
    isPublic: boolean;
    postedAt: Date;

    StoriesEngagementModel?: StoriesEngagement;
}

export interface StoriesContentCreation {
    byAddress: string;
    postedAt: Date;
    StoriesCommunityModel?: StoriesCommunityCreationEager[];
    StoriesEngagementModel?: StoriesEngagementCreation[];
}
