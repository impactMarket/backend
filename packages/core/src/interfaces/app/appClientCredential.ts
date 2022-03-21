export interface AppClientCredential {
    id: number;
    name: string;
    clientId: string;
    clientSecret: string;
    status: 'active' | 'inactive';
    roles?: string[];

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
    roles?: string[];
}
