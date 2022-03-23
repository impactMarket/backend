export interface BeneficiarySubgraph {
    address: string;
    claims: number;
    community: {
        id: string;
    };
    lastClaimAt: number;
    preLastClaimAt: number;
    since?: number;
    claimed: string;
}
