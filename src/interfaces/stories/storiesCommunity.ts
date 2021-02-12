export interface StoriesCommunity {
    id: number;
    contentId: number;
    communityId: string;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface StoriesCommunityCreation {
    contentId: number;
    communityId: string;
}
