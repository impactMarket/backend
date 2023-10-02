export enum LoanManagerFundsSource {
    IMPACT_MARKET = 0,
    HUMA = 1
}

export interface MicroCreditLoanManager {
    id: number;
    userId: number;
    country: string;
    fundsSource: number[];
}

export interface MicroCreditLoanManagerAttributes {
    userId: number;
    country: string;
}
