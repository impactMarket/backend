export interface StoryUserReport {
    id: number;
    contentId: number;
    address: string;
    typeId?: number;
}

export interface StoryUserReportCreation {
    contentId: number;
    address: string;
    typeId?: number;
}
