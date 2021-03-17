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
}
