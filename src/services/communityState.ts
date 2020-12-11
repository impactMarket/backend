import { CommunityState } from '../db/models/communityState';
import database from '../loaders/database';

const db = database();
export default class CommunityStateService {
    public static async add(communityId: string): Promise<CommunityState> {
        return await db.models.communityState.create({
            communityId,
        });
    }

    public static async get(communityId: string): Promise<CommunityState> {
        return (await db.models.communityState.findOne({
            attributes: ['claimed', 'raised', 'beneficiaries', 'backers'],
            where: { communityId },
        }))!;
    }
}
