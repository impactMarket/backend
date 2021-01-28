import { ClaimLocation } from '@models/claimLocation';
import { Op } from 'sequelize';

import { models } from '../../database';

export default class ClaimLocationService {
    public static claimLocation = models.claimLocation;

    public static async add(
        communityId: string,
        gps: {
            latitude: number;
            longitude: number;
        }
    ): Promise<ClaimLocation> {
        return this.claimLocation.create({
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
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // a month ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        return this.claimLocation.findAll({
            attributes: ['gps'],
            where: {
                createdAt: {
                    [Op.gte]: aMonthAgo,
                },
            },
        }) as any;
    }
}
