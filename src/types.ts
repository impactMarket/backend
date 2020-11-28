import { Request } from 'express';

export interface UserInRequest {
    address: string;
}
export interface RequestWithUser extends Request {
    user: UserInRequest;
}
// API to app

export interface ICommunity {
    publicId: string;
    requestByAddress: string;
    contractAddress: string;
    name: string;
    description: string;
    descriptionEn: string;
    language: string;
    currency: string;
    country: string;
    city: string;
    gps: {
        latitude: number;
        longitude: number;
    };
    visibility: string;
    email: string;
    coverImage: string;
    status: string;
    /**
     * @deprecated
     */
    txCreationObj: ICommunityVars; // TODO: remove in future
    started: Date;
}

export interface ICommunityState {
    claimed: string;
    raised: string;
    beneficiaries: number;
    backers: number;
}

export interface ICommunityMetrics {
    ssiDayAlone: number;
    ssi: number;
    ubiRate: number;
    estimatedDuration: number;
    historicalSSI: number[];
}

export interface ICommunityInfo extends ICommunity {
    /**
     * @deprecated
     */
    backers: string[];
    beneficiaries: {
        added: ICommunityInfoBeneficiary[];
        removed: ICommunityInfoBeneficiary[];
    };
    managers: string[];
    /**
     * @deprecated
     */
    ssi: {
        dates: Date[];
        values: number[];
    };
    /**
     * @deprecated
     */
    totalClaimed: string;
    /**
     * @deprecated
     */
    totalRaised: string;
    /**
     * @deprecated
     */
    vars: ICommunityVars; // TODO: remove
    state: ICommunityState;
    metrics?: ICommunityMetrics; // private communities do not have metrics
    contractParams: ICommunityContractParams;
}

/**
 * @deprecated
 */
export interface ICommunityVars {
    _claimAmount: string;
    _baseInterval: string;
    _incrementInterval: string;
    _maxClaim: string;
}

export interface ICommunityContractParams {
    claimAmount: string;
    maxClaim: string;
    baseInterval: number;
    incrementInterval: number;
}

export interface ICommunityInfoBeneficiary {
    address: string;
    name: string;
    timestamp: number;
    claimed: string;
}

export interface IAddressAndName {
    address: string;
    name: string;
}

export interface IUser {
    address: string;
    username: string | null;
    currency: string | null;
    avatar: string;
    language: number;
}

export interface IUserWelcome {
    user: IUser; // TODO: remove in the future, as it's intended to be on memory
    exchangeRates: object; // TODO: this is not really an object
    isBeneficiary: boolean;
    isManager: boolean;
    community?: ICommunityInfo;
}

export interface IUserWelcomeAuth extends IUserWelcome {
    token: string;
}

/**
 * @deprecated
 */
export interface IRecentTxAPI {
    picture: string;
    from: IAddressAndName;
    value: string;
    timestamp: number;
}

/**
 * @deprecated
 */
export interface IPaymentsTxAPI {
    picture: string;
    to: IAddressAndName;
    value: string;
    timestamp: number;
}

/**
 * @deprecated
 */
export interface IUserTxAPI {
    picture: string;
    counterParty: IAddressAndName;
    value: string;
    timestamp: number;
    fromUser: boolean;
}

/**
 * @deprecated
 */
export interface IGlobalStatus {
    totalRaised: string;
    totalDistributed: string;
    totalBeneficiaries: string;
    totalClaims: string;
}

/**
 * @deprecated
 */
export interface IGlobalOutflowStatus {
    claims: any;
    beneficiaries: any;
}

/**
 * @deprecated
 */
export interface IGlobalInflowStatus {
    raises: any;
    rate: any;
}

export enum AgendaAction {
    notification = 'notification',
}

/**
 * @deprecated
 */
export enum GlobalDataTypeEnum {
    totalRaised = 'totalraised',
    totalDistributed = 'totaldistributed',
    totalBeneficiaries = 'totalbeneficiaries',
    totalClaims = 'totalclaims',
}
