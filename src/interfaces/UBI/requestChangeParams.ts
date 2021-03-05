export interface UbiRequestChangeParams {
    id: number;
    communityId: number;
    claimAmount: string;
    maxClaim: string;
    baseInterval: number;
    incrementInterval: number;
}
export interface UbiRequestChangeParamsCreation {
    communityId: number;
    claimAmount: string;
    maxClaim: string;
    baseInterval: number;
    incrementInterval: number;
}
