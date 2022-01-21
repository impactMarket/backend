export interface BeneficiarySubgraph {
    claims: number;
    community: {
        id: string;
    };
    lastClaimAt: number;
    preLastClaimAt: number;
}