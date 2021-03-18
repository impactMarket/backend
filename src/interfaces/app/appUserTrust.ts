export interface AppUserTrust {
    id: number;
    phone: string;
    verifiedPhoneNumber: boolean;

    selfTrust?: AppUserTrust[];
}
export interface AppUserTrustCreation {
    phone: string;
}
