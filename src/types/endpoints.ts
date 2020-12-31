import { CommunityAttributes } from "../db/models/community";
import { CommunityContractAttributes } from "../db/models/communityContract";
import { CommunityDailyMetricsAttributes } from "../db/models/communityDailyMetrics";
import { CommunityStateAttributes } from "../db/models/communityState";
import { UserAttributes } from "../db/models/user";

export interface ICommunityLightDetails {
    publicId: string;
    contractAddress: string;
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

export interface IManagers {
    managers: number,
    beneficiaries: {
        active: number,
        inactive: number
    }
}

export interface IManagerDetailsManager {
    address: string;
    username: string | null;
    timestamp: number;
}

export interface IManagerDetailsBeneficiary {
    address: string;
    username: string | null;
    timestamp: number;
    claimed: string;
}

export interface IManagersDetails {
    managers: IManagerDetailsManager[],
    beneficiaries: {
        active: IManagerDetailsBeneficiary[],
        inactive: IManagerDetailsBeneficiary[]
    }
}

export interface IUserHello {
    exchangeRates: any; // TODO: this is not really an any
    isBeneficiary: boolean;
    isManager: boolean;
    community?: ICommunity;
}

export interface IUserAuth extends IUserHello {
    user: UserAttributes;
    token: string;
}