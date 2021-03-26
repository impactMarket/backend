import { User } from '@interfaces/app/user';
import { CommunityAttributes } from '@models/ubi/community';
import { CommunityContractAttributes } from '@models/ubi/communityContract';
import { CommunityDailyMetricsAttributes } from '@models/ubi/communityDailyMetrics';
import { CommunityStateAttributes } from '@models/ubi/communityState';
import { ExchangeRatesAttributes } from '@models/app/exchangeRates';

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
    metrics?: CommunityDailyMetricsAttributes;
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
    blocked: boolean;
    // to users not yet registered, the values below do not exist
    verifiedPN: boolean | undefined;
    suspect: boolean | undefined;
}

export interface IManagersDetails {
    managers: IManagerDetailsManager[];
    beneficiaries: {
        active: IManagerDetailsBeneficiary[];
        inactive: IManagerDetailsBeneficiary[];
    };
}

export interface IUserHello {
    rates: ExchangeRatesAttributes[];
    isBeneficiary: boolean;
    isManager: boolean;
    community?: ICommunity;
    blocked: boolean;
    // to users not yet registered, the values below do not exist
    verifiedPN: boolean | undefined;
    suspect: boolean | undefined;
}

export interface IUserAuth extends IUserHello {
    user: User;
    token: string;
}

export interface IAddStory {
    byAddress: string;
    communityId?: number;
    // media?: string;
    message?: string;
}

export interface ICommunityStory {
    id: number;
    media: string | null;
    message: string | null;
    loves: number;
    userLoved: boolean;
    userReported: boolean;
}

export interface ICommunitiesListStories {
    id: number;
    name: string;
    coverImage: string;
    story: {
        id: number;
        media: string | null;
        message: string | null;
    }; // most recent
}

export interface ICommunityStories {
    id: number;
    publicId: string; // temporary
    name: string;
    city: string;
    country: string;
    coverImage: string;
    stories: ICommunityStory[];
}

export interface UserStory {
    id: number;
    media: string | null;
    message: string | null;
    loves: number;
}
