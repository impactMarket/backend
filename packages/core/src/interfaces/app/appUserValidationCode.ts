export enum ValidationType {
    SMS
}

export interface AppUserValidationCode {
    id: number;
    userId: number;
    type: number;
    code: string;
    expiresAt: Date;
}

export interface AppUserValidationCodeCreation {
    userId: number;
    type: number;
    code: string;
    expiresAt: Date;
}
