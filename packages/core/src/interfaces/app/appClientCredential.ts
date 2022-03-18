export interface AppClientCredential {
    id: number;
    name: string;
    clientId: string;
    clientSecret: string;
    status: 'active' | 'inactive';

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface AppClientCredentialCreationAttributes {
    id: number;
    name: string;
    clientId: string;
    clientSecret: string;
    status: 'active' | 'inactive';
}
