export interface UbiBeneficiaryTransaction {
    id: number;
    beneficiary: string;
    withAddress: string;
    amount: string;
    isFromBeneficiary: boolean;
    tx: string;
    date: Date;
    txAt: Date;
}

export interface UbiBeneficiaryTransactionCreation {
    beneficiary: string;
    withAddress: string;
    amount: string;
    isFromBeneficiary: boolean;
    tx: string;
    date: Date;
    txAt?: Date;
}
