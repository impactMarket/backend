import { ClaimLocation } from '../models/claimLocation';


export default class ClaimLocationService {
    public static async add(
        communityPublicId: string,
        gps: any,
    ): Promise<ClaimLocation> {
        return ClaimLocation.create({
            communityPublicId,
            gps,
        });
    }

    public static async getAll(): Promise<ClaimLocation[]> {
        return ClaimLocation.findAll();
    }
}