export enum MicroCreditFormStatus {
    PENDING = 'pending',
    SUBMITTED = 'submitted',
    INREVIEW = 'in-review',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

export interface MicroCreditForm {
    id: number;
    userId: number;
    form: object;
    prismicId: string;
    status: MicroCreditFormStatus;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface MicroCreditFormCreationAttributes {
    userId: number;
    form: object;
    prismicId: string;
    status?: MicroCreditFormStatus;
}
