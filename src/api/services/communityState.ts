import { Transaction } from 'sequelize';
import { CommunityState } from '../../db/models/communityState';
import database from '../loaders/database';

const db = database();
export default class CommunityStateService {
    public static async add(
        communityId: string,
        t: Transaction | undefined = undefined,
    ): Promise<CommunityState> {
        return await db.models.communityState.create({
            communityId,
        }, { transaction: t });
    }

    public static async get(communityId: string): Promise<CommunityState> {
        return (await db.models.communityState.findOne({
            attributes: ['claimed', 'raised', 'beneficiaries', 'backers'],
            where: { communityId },
        }))!;
    }
}
