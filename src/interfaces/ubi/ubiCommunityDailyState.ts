export interface UbiCommunityDailyState {
    id: number;
    communityId: number;
    claimed: string;
    claims: number;
    beneficiaries: number;
    raised: string;
    backers: number;
    monthlyBackers: number;
    volume: string;
    transactions: number;
    reach: number;
    reachOut: number;
    fundingRate: number;
    date: Date;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}
export interface UbiCommunityDailyStateCreation {
    communityId: number;
    date: Date;
}
