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
    totalClaimed: string;
    totalRaised: string;
    totalBeneficiaries: number;
    totalManagers: number;
}
export interface UbiCommunityDailyStateCreation {
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
    totalClaimed: string;
    totalRaised: string;
    totalBeneficiaries: number;
    totalManagers: number;
}
