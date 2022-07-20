// API to app

/**
 * @deprecated
 */
export interface ICommunity {
    publicId: string;
    requestByAddress: string;
    contractAddress: string | null;
    name: string;
    description: string;
    descriptionEn: string | null;
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
    started: Date;
}

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
export interface ICommunityInfo extends ICommunity {
    /**
     * @deprecated
     */
    backers: string[];
    beneficiaries: {
        added: IAddressAndName[];
        removed: IAddressAndName[];
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
    claimAmount: string | number;
    maxClaim: string | number;
    baseInterval: number;
    incrementInterval: number;
    blocked?: boolean;
    decreaseStep?: string | number;
    minTranche?: number;
    maxTranche?: number;
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

// TODO: remove
export interface IUser {
    address: string;
    username: string | null;
    currency: string | null;
    avatar: string;
    language: number;
}
// TODO: remove
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
