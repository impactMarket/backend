
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
    txCreationObj: any;
    createdAt: string;
    updatedAt: string;
}

export interface ICommunityInfo extends ICommunity {
    backers: string[];
    beneficiaries: {
        added: IAddressAndName[];
        removed: IAddressAndName[];
    };
    managers: string[];
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