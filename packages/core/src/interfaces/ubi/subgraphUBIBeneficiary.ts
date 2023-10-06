export interface SubgraphUBIBeneficiary {
    id: number;
    userAddress: string;
    communityAddress: string;
    claims: number;
    claimed: number;
    lastClaimAt: number;
    preLastClaimAt: number;
    since: number;
    state: number;

    // timestamps
    updatedAt: Date;
}

export interface SubgraphUBIBeneficiaryCreation {
    userAddress: string;
    communityAddress: string;
    claims: number;
    claimed: number;
    lastClaimAt: number;
    preLastClaimAt: number;
    since: number;
    state: number;
}
