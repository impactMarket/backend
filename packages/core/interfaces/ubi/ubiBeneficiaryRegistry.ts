export enum UbiBeneficiaryRegistryType {
    add,
    remove,
    lock,
    unlock,
}

export interface UbiBeneficiaryRegistry {
    id: number;
    address: string;
    from: string;
    communityId: number;
    activity: UbiBeneficiaryRegistryType;
    tx: string;
    txAt: Date;
}
export interface UbiBeneficiaryRegistryCreation {
    address: string;
    from: string;
    communityId: number;
    activity: UbiBeneficiaryRegistryType;
    tx: string;
    txAt: Date;
}
