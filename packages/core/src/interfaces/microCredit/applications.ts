export interface MicroCreditApplication {
    id: number;
    userId: number;
    form: object;
    selectedLoanManagerId: number;
    prismicId: string;
    amount: number;
    period: number;
    status: number;
    decisionOn: Date;
    signedOn: Date;
    claimedOn: Date;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface MicroCreditApplicationCreation {
    userId: number;
    form?: object;
    selectedLoanManagerId?: number;
    prismicId?: string;
    amount?: number;
    period?: number;
    status?: number;
    decisionOn?: Date;
}

export enum MicroCreditApplicationStatus {
    DRAFT = 0,
    PENDING = 1,
    IN_REVIEW = 2,
    REQUEST_CHANGES = 3,
    INTERVIEW = 4,
    APPROVED = 5,
    REJECTED = 6,
    CANCELED = 10
}
