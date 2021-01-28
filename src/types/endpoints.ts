import { CommunityAttributes } from '@models/community';
import { CommunityContractAttributes } from '@models/communityContract';
import { CommunityDailyMetricsAttributes } from '@models/communityDailyMetrics';
import { CommunityStateAttributes } from '@models/communityState';
import { UserAttributes } from '@models/user';

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
export interface ICommunityPendingDetails {
    publicId: string;
    contractAddress: string;
    requestByAddress: string;
    name: string;
    city: string;
    country: string;
    description: string;
    email: string;
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
    managers: number;
    beneficiaries: {
        active: number;
        inactive: number;
    };
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
    managers: IManagerDetailsManager[];
    beneficiaries: {
        active: IManagerDetailsBeneficiary[];
        inactive: IManagerDetailsBeneficiary[];
    };
}

export interface IUserHello {
    /**
     * @deprecated
     */
    exchangeRates: any; // TODO: remove when 1.0.0 is the lowest version required
    rates: { currency: string; rate: number }[];
    isBeneficiary: boolean;
    isManager: boolean;
    community?: ICommunity;
}

export interface IUserAuth extends IUserHello {
    user: UserAttributes;
    token: string;
}
