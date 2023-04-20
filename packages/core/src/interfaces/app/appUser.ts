import { ManagerAttributes } from '../../database/models/ubi/manager';
import { BeneficiaryAttributes } from '../ubi/beneficiary';

/**
 * @swagger
 *  components:
 *    schemas:
 *      AppUser:
 *        type: object
 *        required:
 *          - address
 *          - username
 *          - language
 *          - currency
 *          - pushNotificationToken
 *          - walletPNT
 *          - appPNT
 *          - gender
 *          - year
 *          - children
 *          - lastLogin
 *          - suspect
 *          - createdAt
 *          - updatedAt
 *          - avatar
 *        properties:
 *          address:
 *            type: string
 *            description: User address
 *          username:
 *            type: string
 *            nullable: true
 *            description: User name (optional)
 *          language:
 *            type: string
 *            description: User language, used in the app
 *          currency:
 *            type: string
 *            description: User currency, used in the app
 *          pushNotificationToken:
 *            type: string
 *            description: User push notifications token, used in the app
 *          walletPNT:
 *            type: string
 *            description: User push notifications token, used in the wallet
 *          appPNT:
 *            type: string
 *            description: User push notifications token, used in the web app
 *          gender:
 *            type: string
 *            enum: [u, m, f, o]
 *            description: User gender (optional)
 *          year:
 *            type: integer
 *            description: User year born (optional)
 *          children:
 *            type: integer
 *            description: User n children (optional)
 *          lastLogin:
 *            type: date
 *            description: User last login
 *          country:
 *            type: string
 *            description: User country
 *          phone:
 *            type: string
 *            description: User phone
 *          suspect:
 *            type: boolean
 *            description: True if user is suspect, set by internal mechanism
 *          createdAt:
 *            type: date
 *            description: Manager date of submission
 *          updatedAt:
 *            type: date
 *            description: Manager date of last update
 */
export interface AppUser {
    id: number;
    address: string;
    avatarMediaId: number | null;
    avatarMediaPath: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    language: string;
    currency: string;
    pushNotificationToken: string | null;
    walletPNT: string | null;
    appPNT: string | null;
    gender: string;
    year: number | null;
    children: number | null;
    lastLogin: Date;
    suspect: boolean;
    active: boolean;
    email: string;
    bio: string;
    country: string | null;
    phone: string | null;
    readBeneficiaryRules?: boolean | null;
    readManagerRules?: boolean | null;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;

    beneficiary?: BeneficiaryAttributes[];
    manager?: ManagerAttributes[];
}
export interface AppUserUpdate {
    address: string;
    avatarMediaPath?: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    language?: string;
    currency?: string;
    pushNotificationToken?: string | null;
    walletPNT?: string | null;
    appPNT?: string | null;
    gender?: string;
    year?: number | null;
    children?: number | null;
    email?: string;
    bio?: string;
    country?: string;
    phone?: string;
}

export interface AppUserCreationAttributes {
    address: string;
    language?: string;
    currency?: string;
    suspect?: boolean; // for test purposes
    username?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    year?: number;
    children?: number;
    avatarMediaId?: number;
    avatarMediaPath?: string;
    pushNotificationToken?: string;
    walletPNT?: string;
    appPNT?: string;
    active?: boolean;
    email?: string;
    bio?: string;
    country?: string;
    phone?: string;
    readBeneficiaryRules?: boolean;
    readManagerRules?: boolean;
}
