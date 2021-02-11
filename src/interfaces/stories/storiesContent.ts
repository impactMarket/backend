export interface StoriesContent {
    id: number;
    media?: number;
    message?: number;
    postedAt: Date;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface StoriesContentCreation {
    postedAt: Date;
}
