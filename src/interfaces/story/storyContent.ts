import { AppMediaContent } from '@interfaces/app/appMediaContent';

import { StoryCommunity, StoryCommunityCreationEager } from './storyCommunity';
import { StoryEngagement, StoryEngagementCreation } from './storyEngagement';
import { StoryUserEngagement } from './storyUserEngagement';
import { StoryUserReport } from './storyUserReport';

export interface StoryContent {
    id: number;
    mediaMediaId: number | null;
    message: string | null;
    byAddress: string;
    isPublic: boolean;
    postedAt: Date;

    // extensions
    media?: AppMediaContent;
    storyCommunity?: StoryCommunity;
    storyEngagement?: StoryEngagement;
    storyUserEngagement?: StoryUserEngagement[];
    storyUserReport?: StoryUserReport[];
}

export interface StoryContentCreation {
    byAddress: string;
    postedAt: Date;
    mediaMediaId?: number;
    message?: string;
    isPublic?: boolean;
    storyCommunity?: StoryCommunityCreationEager[];
    storyEngagement?: StoryEngagementCreation[];
}
