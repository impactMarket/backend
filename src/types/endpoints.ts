import { CommunityAttributes } from "../db/models/community";
import { CommunityContractAttributes } from "../db/models/communityContract";
import { CommunityDailyMetricsAttributes } from "../db/models/communityDailyMetrics";
import { CommunityStateAttributes } from "../db/models/communityState";

export interface ICommunityLightDetails {
    publicId: string;
    name: string;
    city: string;
    country: string;
    coverImage: string;
    state: CommunityStateAttributes;
    contract: CommunityContractAttributes;
}
export interface ICommunity extends CommunityAttributes {
    state: CommunityStateAttributes;
    contract: CommunityContractAttributes;
    metrics: CommunityDailyMetricsAttributes;
}