import { CommunityAttributes } from "../db/models/community";
import { CommunityContractAttributes } from "../db/models/communityContract";
import { CommunityDailyMetricsAttributes } from "../db/models/communityDailyMetrics";
import { CommunityStateAttributes } from "../db/models/communityState";

export interface ICommunity extends CommunityAttributes {
    state: CommunityStateAttributes;
    contract: CommunityContractAttributes;
    metrics: CommunityDailyMetricsAttributes;
}