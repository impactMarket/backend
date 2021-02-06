export interface User {
    address: string;
    username: string | null;
    language: string;
    currency: string;
    pushNotificationToken: string | null;
    gender: string | null;
    year: number | null;
    children: number | null;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}
