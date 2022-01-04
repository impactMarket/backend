export interface AppAnonymousReport {
    id: number;
    communityId: number;
    message: string;
    category: 'general' | 'potential-fraud';
    review: 'pending' | 'in-progress' | 'halted' | 'closed';
    createdAt: Date;
}
export interface AppAnonymousReportCreation {
    communityId?: number;
    message: string;
    category?: 'general' | 'potential-fraud';
}
