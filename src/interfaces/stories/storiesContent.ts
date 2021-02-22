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

    storyEngage?: StoriesEngagement;
}

export interface StoriesContentCreation {
    byAddress: string;
    postedAt: Date;
    media?: string;
    message?: string;
    storyCommunity?: StoriesCommunityCreationEager[];
    storyEngage?: StoriesEngagementCreation[];
}
