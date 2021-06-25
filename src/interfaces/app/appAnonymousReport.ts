export interface AppAnonymousReport {
    id: number;
    communityId: string;
    message: string;
    category: string;
    status: 'pending' | 'in-progress' | 'halted' | 'closed';
    createdAt: Date;
}
export interface AppAnonymousReportCreation {
    communityId?: string;
    message: string;
    category?: string;
}
