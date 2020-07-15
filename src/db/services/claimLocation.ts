import { ClaimLocation } from '../models/claimLocation';


export default class ClaimLocationService {
    public static async add(
        gps: any,
    ): Promise<ClaimLocation> {
        return ClaimLocation.create({
            gps,
        });
    }

    public static async getAll(): Promise<ClaimLocation[]> {
        return ClaimLocation.findAll();
    }
}