/**
 * @swagger
 *  components:
 *    schemas:
 *      AppUser:
 *        type: object
 *        required:
 *          - address
 *          - language
 *          - currency
 *          - walletPNT
 *          - appPNT
 *          - gender
 *          - year
 *          - children
 *          - lastLogin
 *          - createdAt
 *          - updatedAt
 *          - avatar
 *        properties:
 *          address:
 *            type: string
 *            description: User address
 *          language:
 *            type: string
 *            description: User language, used in the app
 *          currency:
 *            type: string
 *            description: User currency, used in the app
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
    avatarMediaPath: string | null;
    firstName: string | null;
    lastName: string | null;
    language: string;
    currency: string;
    walletPNT: string | null;
    appPNT: string | null;
    gender: string;
    year: number | null;
    children: number | null;
    lastLogin: Date;
    active: boolean;
    email: string;
    emailValidated: boolean;
    bio: string;
    country: string | null;
    phone: string | null;
    phoneValidated: boolean;
    readBeneficiaryRules?: boolean | null;
    readManagerRules?: boolean | null;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
export interface AppUserUpdate {
    address: string;
    avatarMediaPath?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    language?: string;
    currency?: string;
    walletPNT?: string | null;
    appPNT?: string | null;
    gender?: string;
    year?: number | null;
    children?: number | null;
    email?: string;
    emailValidated?: boolean;
    bio?: string;
    country?: string;
    phone?: string;
    phoneValidated?: boolean;
}

export interface AppUserCreationAttributes {
    address: string;
    language?: string;
    currency?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    year?: number;
    children?: number;
    avatarMediaPath?: string;
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
