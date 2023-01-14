export interface IAddStory {
    byAddress?: string;
    communityId?: number;
    storyMediaId?: number;
    storyMediaPath?: string;
    storyMedia?: string[];
    message?: string;
}

export interface ICommunityStory {
    id: number;
    message: string | null;
    byAddress: string;
    storyMediaPath: string | null;
    loves: number;
    userLoved: boolean;
    userReported: boolean;
}
export interface ICommunityStoryGet {
    id: number;
    message: string | null;
    storyMediaPath: string | null;
    isDeletable: boolean;
    createdAt: Date;
    community?: any;
    engagement: {
        loves: number;
        userLoved: boolean;
        userReported?: boolean;
        comments: number;
    };
}
