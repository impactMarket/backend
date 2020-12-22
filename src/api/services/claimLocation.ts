import { ClaimLocation } from '@models/claimLocation';
import database from "../loaders/database";

const db = database();
export default class ClaimLocationService {
    public static async add(
        communityId: string,
        gps: {
            latitude: number;
            longitude: number;
        }
    ): Promise<ClaimLocation> {
        return db.models.claimLocation.create({
            communityId,
            gps,
        });
    }

    public static async getAll(): Promise<ClaimLocation[]> {
        return db.models.claimLocation.findAll();
    }
}
