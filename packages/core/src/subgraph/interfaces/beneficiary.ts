export interface BeneficiarySubgraph {
    address: string;
    community: {
        id: string;
    };
    since?: number;
    claimed?: string;
    state?: number;
}
