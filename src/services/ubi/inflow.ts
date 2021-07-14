import { Logger } from '@utils/logger';
import { col, fn } from 'sequelize';

import { models } from '../../database';

export default class InflowService {
    public static inflow = models.inflow;

    public static async add(
        from: string,
        communityId: string,
        amount: string,
        tx: string,
        txAt: Date
    ): Promise<void> {
        const inflowData = {
            from,
            communityId,
            amount,
            tx,
            txAt,
        };
        try {
            await this.inflow.create(inflowData);
        } catch (e) {
            if (e.name !== 'SequelizeUniqueConstraintError') {
                Logger.error(
                    'Error inserting new Inflow. Data = ' +
                        JSON.stringify(inflowData)
                );
                Logger.error(e);
            }
        }
    }

    public static async getAllBackers(communityId: string): Promise<string[]> {
        const backers = (
            await this.inflow.findAll({
                attributes: [[fn('distinct', col('from')), 'backerAddress']],
                where: { communityId },
                raw: true,
            })
        ).map((b: any) => b.backerAddress);
        return backers;
    }

    /**
     * Count unique backers since the begining of the project.
     */
    public static async countEvergreenBackers(): Promise<number> {
        const backers: { total: string } = (
            await this.inflow.findAll({
                attributes: [
                    [fn('count', fn('distinct', col('from'))), 'total'],
                ],
                raw: true,
            })
        )[0] as any;
        return parseInt(backers.total, 10);
    }
}
