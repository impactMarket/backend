export interface UbiCommunityContract {
    communityId: string;
    claimAmount: string;
    maxClaim: string;
    baseInterval: number;
    incrementInterval: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface UbiCommunityContractCreation {
    communityId: string;
    claimAmount: string;
    maxClaim: string;
    baseInterval: number;
    incrementInterval: number;
}
