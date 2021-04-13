import { BeneficiaryAttributes } from '@models/ubi/beneficiary';
import { ManagerAttributes } from '@models/ubi/manager';

import { AppMediaContent } from './appMediaContent';
import { AppUserTrust } from './appUserTrust';

export interface User {
    address: string;
    avatarMediaId: number | null;
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

    avatar?: AppMediaContent;
    throughTrust?: AppUserTrust[];
    beneficiary?: BeneficiaryAttributes[];
    manager?: ManagerAttributes[];
}

export interface UserCreationAttributes {
    address: string;
    language: string;
    currency?: string;
    pushNotificationToken: string;
}
