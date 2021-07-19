import { Op } from 'sequelize';

import { models } from '../../database';

export default class ClaimLocationService {
    public static claimLocation = models.claimLocation;
    public static community = models.community;

    public static async add(
        communityId: string,
        gps: {
            latitude: number;
            longitude: number;
        }
    ): Promise<void> {
        await this.claimLocation.create({
            communityId,
            gps,
        });
    }

    public static async getAll(): Promise<
        {
            latitude: number;
            longitude: number;
        }[]
    > {
        const fiveMonthsAgo = new Date();
        fiveMonthsAgo.setDate(fiveMonthsAgo.getDate() - 30 * 5);
        return this.claimLocation.findAll({
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
