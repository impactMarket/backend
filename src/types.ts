
// API to app

export interface ICommunity {
    publicId: string;
    requestByAddress: string;
    contractAddress: string;
    name: string;
    description: string;
    location: {
        title: string;
        latitude: number;
        longitude: number;
    };
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
    _amountByClaim: string;
    _baseIntervalTime: string;
    _incIntervalTime: string;
    _claimHardCap: string;
}

export interface IAddressAndName {
    address: string;
    name: string;
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