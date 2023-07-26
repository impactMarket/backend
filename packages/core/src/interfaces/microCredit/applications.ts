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
    APPROVED = 4,
    REJECTED = 5
}
