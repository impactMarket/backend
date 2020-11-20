import { ClaimLocation } from '../db/models/claimLocation';


export default class ClaimLocationService {
    public static async add(
        communityId: string,
        gps: any,
    ): Promise<ClaimLocation> {
        return ClaimLocation.create({
            communityId,
            gps,
        });
    }

    public static async getAll(): Promise<ClaimLocation[]> {
        return ClaimLocation.findAll();
    }
}