import { CommunityState } from '@models/communityState';
import { QueryTypes, Transaction } from 'sequelize';

import { models, sequelize } from '../../database';

export default class CommunityStateService {
    public static communityState = models.communityState;
    public static sequelize = sequelize;

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

    /**
     * Only public valid
     */
    public static getAllCommunitiesState(): Promise<CommunityState[]> {
        const query = `select "communityId", claimed, raised, beneficiaries, backers
        from communitystate cs , community c
        where cs."communityId" = c."publicId"
          and c.status = 'valid'
          and c.visibility = 'public'`;

        return this.sequelize.query<CommunityState>(query, { type: QueryTypes.SELECT });
    }
}
