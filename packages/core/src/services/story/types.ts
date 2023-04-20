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
    loves: number;
    userLoved: boolean;
    userReported: boolean;
    storyMedia?: string[];
}
export interface ICommunityStoryGet {
    id: number;
    message: string | null;
    storyMedia?: string[];
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
