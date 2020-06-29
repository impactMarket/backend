
// API to app

export interface ICommunity {
    publicId: string;
    requestByAddress: string;
    contractAddress: string;
    name: string;
    description: string;
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
    txCreationObj: ICommunityVars;
    createdAt: string;
    updatedAt: string;
}

export interface ICommunityInfo extends ICommunity {
    backers: string[];
    beneficiaries: {
        added: ICommunityInfoBeneficiary[];
        removed: ICommunityInfoBeneficiary[];
    };
    managers: string[];
    ssi: number[];
    totalClaimed: string;
    totalRaised: string;
    vars: ICommunityVars;
}

export interface ICommunityVars {
    _claimAmount: string;
    _baseInterval: string;
    _incrementInterval: string;
    _maxClaim: string;
}

export interface ICommunityInfoBeneficiary {
    address: string;
    name: string;
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
}

export interface IRecentTxAPI {
    from: IAddressAndName;
    txs: number;
    timestamp: number;
}

export interface IPaymentsTxAPI {
    to: IAddressAndName;
    value: string;
    timestamp: number;
}