import { ExchangeRatesAttributes } from '../database/models/app/exchangeRates';
import { AppMediaContent } from '../interfaces/app/appMediaContent';
import { AppUser } from '../interfaces/app/appUser';
import { CommunityAttributes } from '../interfaces/ubi/community';
import { UbiCommunityContract } from '../interfaces/ubi/ubiCommunityContract';
import { UbiCommunityState } from '../interfaces/ubi/ubiCommunityState';
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

export interface IListBeneficiary {
    address: string;
    username: string | null;
    timestamp: number;
    claimed: string;
    blocked: boolean;
    // to users not yet registered, the values below do not exist
    verifiedPN?: boolean | undefined; // TODO: to be removed
    suspect: boolean | undefined;
}

export interface IManagersDetails {
    managers: IManagerDetailsManager[];
    beneficiaries: {
        active: IListBeneficiary[];
        inactive: IListBeneficiary[];
    };
}

export interface IManager {
    communityId: number;
    readRules: boolean;
}

export interface IBeneficiary {
    communityId: number;
    blocked: boolean;
    readRules: boolean;
}

interface IUser {
    suspect: boolean | undefined;
}

export interface IUserHello {
    rates?: ExchangeRatesAttributes[]; // TODO: deprecated in mobile-app@1.1.5
    isBeneficiary?: boolean; // TODO: deprecated
    isManager?: boolean; // TODO: deprecated
    community?: CommunityAttributes; // TODO: deprecated in mobile-app@1.1.5
    communityId?: number; // TODO: deprecated
    blocked?: boolean; // TODO: deprecated
    // to users not yet registered, the values below do not exist
    verifiedPN?: boolean | undefined; // TODO: deprecated in mobile-app@1.1.5
    suspect?: boolean | undefined; // TODO: deprecated
    beneficiary: IBeneficiary | null;
    manager: IManager | null;
    user: IUser;
}

export interface IUserAuth extends IUserHello {
    user: AppUser;
    token: string;
}

export interface IAddStory {
    byAddress: string;
    communityId?: number;
    mediaId?: number;
    message?: string;
}

/**
 * @swagger
 *  components:
 *    schemas:
 *      ICommunityStory:
 *        type: object
 *        required:
 *          - id
 *          - message
 *          - byAddress
 *          - media
 *          - loves
 *          - userLoved
 *          - userReported
 *        properties:
 *          id:
 *            type: integer
 *            description: New story id
 *          message:
 *            type: string
 *            nullable: true
 *            description: Story message
 *          byAddress:
 *            type: string
 *            description: The author of the story
 *          media:
 *            $ref: '#/components/schemas/AppMediaContent'
 *          loves:
 *            type: integer
 *            description: Story total number of loves
 *          userLoved:
 *            type: boolean
 *            description: Has user loved this story?
 *          userReported:
 *            type: boolean
 *            description: Has used reported this story?
 */
export interface ICommunityStory {
    id: number;
    message: string | null;
    byAddress: string;
    media?: AppMediaContent;
    loves: number;
    userLoved: boolean;
    userReported: boolean;
}

/**
 * @swagger
 *  components:
 *    schemas:
 *      ICommunitiesListStories:
 *        type: object
 *        required:
 *          - id
 *          - name
 *          - cover
 *          - story
 *        properties:
 *          id:
 *            type: integer
 *            description: Community id
 *          name:
 *            type: string
 *            description: Community name
 *          cover:
 *            $ref: '#/components/schemas/AppMediaContent'
 *          story:
 *            type: object
 *            properties:
 *              media:
 *                $ref: '#/components/schemas/AppMediaContent'
 *              message:
 *                type: string
 *                nullable: true
 *                description: Most recent story message
 */
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

/**
 * @swagger
 *  components:
 *    schemas:
 *      ICommunityStories:
 *        type: object
 *        required:
 *          - id
 *          - name
 *          - city
 *          - country
 *          - cover
 *          - stories
 *        properties:
 *          id:
 *            type: integer
 *            description: Community id
 *          name:
 *            type: string
 *            description: Community name
 *          city:
 *            type: string
 *            description: Community city
 *          country:
 *            type: string
 *            description: Community country
 *          cover:
 *            $ref: '#/components/schemas/AppMediaContent'
 *          stories:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/ICommunityStory'
 */
export interface ICommunityStories {
    id: number;
    name: string;
    city: string;
    country: string;
    cover: AppMediaContent;
    stories: ICommunityStory[];
}

export type IBeneficiaryActivities = {
    id: number;
    type: string;
    tx: string;
    txAt: Date;
    withAddress?: string;
    isFromBeneficiary?: boolean;
    amount?: string;
    username?: string;
};

export type BeneficiaryFilterType = {
    active?: boolean;
    suspect?: boolean;
    inactivity?: boolean;
    loginInactivity?: boolean;
    unidentified?: boolean;
    blocked?: boolean;
};
