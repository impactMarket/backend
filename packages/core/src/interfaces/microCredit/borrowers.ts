export interface MicroCreditBorrowers {
    id: number;
    userId: number;
    performance: number;
	lastNotificationRepayment: Date | null;
}

export interface MicroCreditBorrowersCreation {
    userId: number;
    performance: number;
	lastNotificationRepayment?: Date;
}
