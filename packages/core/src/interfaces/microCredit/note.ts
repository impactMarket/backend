export interface MicroCreditNote {
    id: number;
    userId: number;
    managerId: number;
    note: string;

    // timestamps
    createdAt: Date;
}

export interface MicroCreditNoteCreationAttributes {
    userId: number;
    managerId: number;
    note: string;
}
