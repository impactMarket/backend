export interface MicroCreditNotes {
    id: number;
    userId: number;
    managerId: number;
    note: string;

    // timestamps
    createdAt: Date;
}

export interface MicroCreditNotesCreationAttributes {
    userId: number;
    managerId: number;
    note: string;
}
