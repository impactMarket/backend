export interface SubgraphMicroCreditBorrowers {
    id: number;
    userId: number;
    lastRepayment?: number;
    lastRepaymentAmount?: number;
    lastDebt?: number;
    amount: number;
    period: number;
    claimed?: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface SubgraphMicroCreditBorrowersCreation {
    userId: number;
    lastRepayment?: number;
    lastRepaymentAmount?: number;
    lastDebt?: number;
    amount: number;
    period: number;
    claimed?: number;
}