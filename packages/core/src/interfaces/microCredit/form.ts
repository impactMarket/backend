export interface MicroCreditForm {
    id: number;
    userId: number;
    form: object;
    submitted: boolean;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface MicroCreditFormCreationAttributes {
    userId: number;
    form: object;
    submitted?: boolean;
}
