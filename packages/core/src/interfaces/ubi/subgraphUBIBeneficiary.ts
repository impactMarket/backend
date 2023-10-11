export interface SubgraphUBIBeneficiary {
    id: number;
    userAddress: string;
    communityAddress: string;
    claimed: number;
    since: number;
    state: number;

    // timestamps
    updatedAt: Date;
}

export interface SubgraphUBIBeneficiaryCreation {
    userAddress: string;
    communityAddress: string;
    claimed: number;
    since: number;
    state: number;
}
