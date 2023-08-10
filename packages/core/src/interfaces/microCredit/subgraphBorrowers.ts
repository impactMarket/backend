export interface SubgraphMicroCreditBorrowers {
    id: number;
    userId: number;
    lastRepayment?: number;
    lastRepaymentAmount?: number;
    lastDebt?: number;
    amount: number;
    period: number;
    claimed?: number;
    dailyInterest?: number;
    repaid?: number;
    status: number;

    // timestamps
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
    dailyInterest?: number;
    repaid?: number;
    status: number;
}
