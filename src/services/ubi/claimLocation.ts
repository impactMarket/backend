import { Op } from 'sequelize';

import { models } from '../../database';

export default class ClaimLocationService {
    public static async add(
        communityId: string | number,
        gps: {
            latitude: number;
            longitude: number;
        }
    ): Promise<void> {
        let nCommunityId = 0;
        if (typeof communityId === 'string') {
            const r = await models.community.findOne({
                attributes: ['id'],
                where: {
                    publicId: communityId,
                },
            });
            nCommunityId = r!.id;
        } else {
            nCommunityId = communityId;
        }
        await models.ubiClaimLocation.create({
            communityId: nCommunityId,
            gps,
        });
    }

    public static async getByCommunity(communityId: number) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
        threeMonthsAgo.setHours(0, 0, 0, 0);

        const res = await models.ubiClaimLocation.findAll({
            attributes: ['gps'],
            where: {
                createdAt: { [Op.gte]: threeMonthsAgo },
                communityId,
            },
        });
        return res.map((r) => r.gps);
    }

    public static async getAll(): Promise<
        {
            latitude: number;
            longitude: number;
        }[]
    > {
        const fiveMonthsAgo = new Date();
        fiveMonthsAgo.setDate(fiveMonthsAgo.getDate() - 30 * 5);
        return models.ubiClaimLocation.findAll({
            attributes: ['gps'],
            where: {
                createdAt: {
                    [Op.gte]: fiveMonthsAgo,
                },
            },
            raw: true,
        }) as any;
    }
}
