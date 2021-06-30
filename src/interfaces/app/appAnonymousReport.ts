export interface AppAnonymousReport {
    id: number;
    communityId: string;
    message: string;
    category: 'general' | 'fraud';
    status: 'pending' | 'in-progress' | 'halted' | 'closed';
    createdAt: Date;
}
export interface AppAnonymousReportCreation {
    communityId?: string;
    message: string;
    category?: 'general' | 'fraud';
}
