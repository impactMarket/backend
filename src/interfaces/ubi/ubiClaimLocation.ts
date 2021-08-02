export interface UbiClaimLocation {
    id: number;
    communityId: string;
    gps: {
        latitude: number;
        longitude: number;
    };

    // timestamps
    createdAt: Date;
}
export interface UbiClaimLocationCreation {
    communityId: number;
    gps: {
        latitude: number;
        longitude: number;
    };
}
