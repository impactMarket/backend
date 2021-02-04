export interface GlobalDailyGrowth {
    date: Date;
    claimed: number;
    claims: number;
    beneficiaries: number;
    raised: number;
    backers: number;
    fundingRate: number;
    volume: number;
    transactions: number;
    reach: number;
    reachOut: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface GlobalDailyGrowthCreation {
    date: Date;
    claimed: number;
    claims: number;
    beneficiaries: number;
    raised: number;
    backers: number;
    fundingRate: number;
    volume: number;
    transactions: number;
    reach: number;
    reachOut: number;
}
