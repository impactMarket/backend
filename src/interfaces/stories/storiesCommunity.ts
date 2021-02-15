import { StoriesContent } from './storiesContent';

export interface StoriesCommunity {
    id: number;
    contentId: number;
    communityId: number;

    StoriesContentModel?: StoriesContent;
}

export interface StoriesCommunityCreation {
    contentId: number;
    communityId: number;
}
export interface StoriesCommunityCreationEager {
    // contentId: number;
    communityId: number;
}
