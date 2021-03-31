export interface AppAnonymousReport {
    id: number;
    communityId: string;
    message: string;
    createdAt: Date;
}
export interface AppAnonymousReportCreation {
    communityId?: string;
    message: string;
}
