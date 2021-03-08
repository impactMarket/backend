export interface AppUserDevice {
    id: number;
    userAddress: string;
    phone: string;
    identifier: string;
    device: string;
    network: string;
    lastLogin: Date;
}
export interface AppUserDeviceCreation {
    userAddress: string;
    phone: string;
    identifier: string;
    device: string;
    network: string;
    lastLogin: Date;
}
