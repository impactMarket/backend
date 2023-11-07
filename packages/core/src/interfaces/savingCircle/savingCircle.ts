export interface SavingCircle {
    id: number;
    name: string;
    country: string;
    amount: number;
    frequency: number;
    firstDepositOn: Date;
    requestedBy: number;
    status: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface SavingCircleCreation {
    name: string;
    country: string;
    amount: number;
    frequency: number;
    firstDepositOn: Date;
    requestedBy: number;
    status: number;
}
