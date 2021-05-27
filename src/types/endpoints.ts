import { AppMediaContent } from '@interfaces/app/appMediaContent';
import { User } from '@interfaces/app/user';
import { StoryContent } from '@interfaces/story/storyContent';
import { UbiCommunityContract } from '@interfaces/ubi/ubiCommunityContract';
import { UbiCommunityState } from '@interfaces/ubi/ubiCommunityState';
import { ExchangeRatesAttributes } from '@models/app/exchangeRates';
import { CommunityAttributes } from '@models/ubi/community';

export interface ICommunityLightDetails {
    id: number;
    /**
     * @deprecated
     */
    publicId: string;
    contractAddress: string;
    name: string;
    city: string;
    country: string;
    /**
     * @deprecated
     */
    coverImage: string;
    cover: AppMediaContent;
    state: UbiCommunityState;
    contract: UbiCommunityContract;
}
export interface ICommunityPendingDetails {
    id: number;
    /**
     * @deprecated
     */
    publicId: string;
    contractAddress: string;
    requestByAddress: string;
    name: string;
    city: string;
    country: string;
    description: string;
    email: string;
    /**
     * @deprecated
     */
    coverImage: string;
    state: UbiCommunityState;
    contract: UbiCommunityContract;
}
export interface ICommunity extends CommunityAttributes {
    state: UbiCommunityState; // TODO: delete
    contract: UbiCommunityContract; // TODO: delete
    // metrics?: UbiCommunityDailyMetrics; // TODO: delete
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
    community?: CommunityAttributes;
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
    mediaId?: number;
    message?: string;
}

export interface ICommunityStory {
    id: number;
    message: string | null;
    byAddress: string;
    media?: AppMediaContent;
    loves: number;
    userLoved: boolean;
    userReported: boolean;
}

export interface ICommunitiesListStories {
    id: number;
    name: string;
    cover: AppMediaContent;
    story: {
        id: number;
        media?: AppMediaContent;
        message: string | null;
    }; // most recent
}

export interface ICommunityStories {
    id: number;
    // publicId: string; // temporary
    name: string;
    city: string;
    country: string;
    cover: AppMediaContent;
    stories: ICommunityStory[];
}

// export interface UserStory {
//     id: number;
//     media?: AppMediaContent;
//     message: string | null;
//     loves: number;
// }
