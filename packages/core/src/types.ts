// API to app

export const enum intervalsInSeconds {
    twoMins = 120,
    halfHour = 1800,
    oneHour = 3600,
    sixHours = 21600,
    twelveHours = 43200,
    oneDay = 86400,
}

export interface ICommunityMetrics {
    ssiDayAlone: number;
    ssi: number;
    ubiRate: number;
    estimatedDuration: number;
    historicalSSI: number[];
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
