export interface MicroCreditBorrowersHuma {
    id: number;
    userId: number;
    humaRWRReferenceId: string;
    repaid: boolean;
}

export interface MicroCreditBorrowersHumaCreation {
    userId: number;
    humaRWRReferenceId: string;
}
