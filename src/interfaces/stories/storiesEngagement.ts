export interface StoriesEngagement {
    contentId: number;
    likes: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface StoriesEngagementCreation {
    contentId: number;
}
