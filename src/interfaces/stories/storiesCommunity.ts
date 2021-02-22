import { StoriesContent } from './storiesContent';

export interface StoriesCommunity {
    id: number;
    contentId: number;
    communityId: number;

    storyContent?: StoriesContent;
}

export interface StoriesCommunityCreation {
    contentId: number;
    communityId: number;
}
export interface StoriesCommunityCreationEager {
    // contentId: number;
    communityId: number;
}
