export interface MicroCreditBorrowers {
    id: number;
    userId: number;
    performance: number;
	lastNotificationRepayment: Date | null;
    manager: string;
}

export interface MicroCreditBorrowersCreation {
    userId: number;
    performance: number;
	lastNotificationRepayment?: Date;
    manager: string;
}
