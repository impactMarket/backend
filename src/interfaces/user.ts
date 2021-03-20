import { BeneficiaryAttributes } from '@models/beneficiary';
import { ManagerAttributes } from '@models/manager';
import { AppUserTrust, AppUserTrustCreation } from './app/appUserTrust';

export interface User {
    address: string;
    username: string | null;
    language: string;
    currency: string;
    pushNotificationToken: string | null;
    gender: string;
    year: number | null;
    children: number | null;
    lastLogin: Date;

    // timestamps
    createdAt: Date;
    updatedAt: Date;

    throughTrust?: AppUserTrust[];
    beneficiary?: BeneficiaryAttributes[];
    manager?: ManagerAttributes[];
}

export interface UserCreationAttributes {
    address: string;
    language: string;
    currency?: string;
    pushNotificationToken: string;

    throughTrust?: AppUserTrustCreation[];
}
