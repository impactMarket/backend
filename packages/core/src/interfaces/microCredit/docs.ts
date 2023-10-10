export interface MicroCreditDocs {
    id: number;
    userId: number;
    applicationId: number;
    category: number;
    filepath: string;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface MicroCreditDocsCreationAttributes {
    userId: number;
    applicationId: number;
    category: number;
    filepath: string;
}
