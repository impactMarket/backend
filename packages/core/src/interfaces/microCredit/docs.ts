export interface MicroCreditDocs {
    id: number;
    userId: number;
    category: number;
    filepath: string;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface MicroCreditDocsCreationAttributes {
    userId: number;
    category: number;
    filepath: string;
}
