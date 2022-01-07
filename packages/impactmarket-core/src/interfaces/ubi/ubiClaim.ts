export interface UbiClaim {
    id: number;
    address: string;
    communityId: number;
    amount: string;
    tx: string;
    txAt: Date;
}
export interface UbiClaimCreation {
    address: string;
    communityId: number;
    amount: string;
    tx: string;
    txAt: Date;
}
