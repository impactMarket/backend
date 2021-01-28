import { CommunityState } from '@models/communityState';
import { Transaction } from 'sequelize';

import { models, sequelize } from '../../database';

// const db = database();
export default class CommunityStateService {
    public static communityState = models.communityState;

    public static async add(
        communityId: string,
        t: Transaction | undefined = undefined
    ): Promise<CommunityState> {
        return await this.communityState.create(
            {
                communityId,
            },
            { transaction: t }
        );
    }

    public static async get(communityId: string): Promise<CommunityState> {
        return (await this.communityState.findOne({
            attributes: ['claimed', 'raised', 'beneficiaries', 'backers'],
            where: { communityId },
        }))!;
    }
}
