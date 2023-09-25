export interface SubgraphUBICommunity {
    id: number;
    communityAddress: string;
    estimatedFunds: number;
    claims: number;
    claimed: number;
    beneficiaries: number;
    removedBeneficiaries: number;
    contributed: number;
    contributors: number;
    managers: number;
    baseInterval: number;
    state: number;

    // timestamps
    updatedAt: Date;
}

export interface SubgraphUBICommunityCreation {
    communityAddress: string;
    estimatedFunds: number;
    claims: number;
    claimed: number;
    beneficiaries: number;
    removedBeneficiaries: number;
    contributed: number;
    contributors: number;
    managers: number;
    baseInterval: number;
    state: number;
}
