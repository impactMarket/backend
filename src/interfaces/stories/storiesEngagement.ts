export interface StoriesEngagement {
    id: number;
    contentId: number;
    likes: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface StoriesEngagementCreation {
    contentId: number;
}
