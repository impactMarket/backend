import { StoryCommunityCreationEager } from './storyCommunity';
import { StoryEngagement, StoryEngagementCreation } from './storyEngagement';
import { StoryUserEngagement } from './storyUserEngagement';

export interface StoryContent {
    id: number;
    media: string | null;
    message: string | null;
    byAddress: string;
    isPublic: boolean;
    postedAt: Date;

    storyEngagement?: StoryEngagement;
    storyUserEngagement?: StoryUserEngagement[];
}

export interface StoryContentCreation {
    byAddress: string;
    postedAt: Date;
    media?: string;
    message?: string;
    isPublic?: boolean;
    storyCommunity?: StoryCommunityCreationEager[];
    storyEngagement?: StoryEngagementCreation[];
}
