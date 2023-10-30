export interface MicroCreditBorrowers {
    id: number;
    userId: number;
    applicationId: number;
    performance: number;
    repaymentRate: number;
    lastNotificationRepayment: Date | null;
    manager: string;
}

export interface MicroCreditBorrowersCreation {
    userId: number;
    applicationId: number;
    performance?: number;
    repaymentRate?: number;
    lastNotificationRepayment?: Date;
    manager?: string;
}
