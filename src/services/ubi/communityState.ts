import { UbiCommunityState } from '@interfaces/ubi/ubiCommunityState';
import { QueryTypes, Transaction } from 'sequelize';

import { models, sequelize } from '../../database';

export default class CommunityStateService {
    public static ubiCommunityState = models.ubiCommunityState;
    public static sequelize = sequelize;

    public static async add(
        communityId: number,
        t: Transaction | undefined = undefined
    ): Promise<UbiCommunityState> {
        return await this.ubiCommunityState.create(
            {
                communityId,
            },
            { transaction: t }
        );
    }

    public static async get(communityId: number): Promise<UbiCommunityState> {
        return (await this.ubiCommunityState.findOne({
            attributes: ['claimed', 'raised', 'beneficiaries', 'backers'],
            where: { communityId },
            raw: true,
        }))!;
    }

    /**
     * Only public valid
     */
    public static getAllCommunitiesState(): Promise<UbiCommunityState[]> {
        const query = `select "communityId", claimed, raised, beneficiaries, backers
        from ubi_community_state cs , community c
        where cs."communityId" = c.id
          and c.status = 'valid'
          and c.visibility = 'public'`;

        return this.sequelize.query<UbiCommunityState>(query, {
            type: QueryTypes.SELECT,
        });
    }
}
