import { StoryContent } from './storyContent';

export interface StoryCommunity {
    id: number;
    contentId: number;
    communityId: number;

    storyContent?: StoryContent;
}

export interface StoryCommunityCreation {
    contentId: number;
    communityId: number;
}
export interface StoryCommunityCreationEager {
    // contentId: number;
    communityId: number;
}
