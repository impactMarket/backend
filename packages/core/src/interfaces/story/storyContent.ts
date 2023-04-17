import { AppUser } from '../app/appUser';
import { StoryCommunity, StoryCommunityCreationEager } from './storyCommunity';
import { StoryEngagement, StoryEngagementCreation } from './storyEngagement';
import { StoryUserEngagement } from './storyUserEngagement';
import { StoryUserReport } from './storyUserReport';

export interface StoryContent {
    id: number;
    mediaMediaId: number | null;
    storyMediaPath: string | null;
    message: string | null;
    byAddress: string;
    isPublic: boolean;
    postedAt: Date;

    // extensions
    storyCommunity?: StoryCommunity;
    storyEngagement?: StoryEngagement;
    storyUserEngagement?: StoryUserEngagement[];
    storyUserReport?: StoryUserReport[];
    storyMedia?: string[];
    user?: AppUser;
}

export interface StoryContentCreation {
    byAddress: string;
    postedAt: Date;
    mediaMediaId?: number;
    storyMediaPath?: string;
    storyMedia?: string[];
    message?: string;
    isPublic?: boolean;
    storyCommunity?: StoryCommunityCreationEager[];
    storyEngagement?: StoryEngagementCreation[];
}
