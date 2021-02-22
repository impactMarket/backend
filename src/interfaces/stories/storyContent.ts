import { StoryCommunityCreationEager } from './storyCommunity';
import { StoryEngagement, StoryEngagementCreation } from './storyEngagement';

export interface StoryContent {
    id: number;
    media: string | null;
    message: string | null;
    byAddress: string;
    isPublic: boolean;
    postedAt: Date;

    storyEngage?: StoryEngagement;
}

export interface StoryContentCreation {
    byAddress: string;
    postedAt: Date;
    media?: string;
    message?: string;
    storyCommunity?: StoryCommunityCreationEager[];
    storyEngage?: StoryEngagementCreation[];
}
