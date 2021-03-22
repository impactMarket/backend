import { AppUserThroughTrustCreation } from './appUserThroughTrust';

export interface AppUserTrust {
    id: number;
    phone: string;
    verifiedPhoneNumber: boolean;
    suspect: boolean;

    selfTrust?: AppUserTrust[];
}
export interface AppUserTrustCreation {
    phone: string;
    throughTrust?: AppUserThroughTrustCreation;
}
