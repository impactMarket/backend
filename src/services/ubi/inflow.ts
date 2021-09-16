import { Logger } from '@utils/logger';
import { col, fn } from 'sequelize';

import { models } from '../../database';
import { AssetType } from '@models/ubi/inflow';
export default class InflowService {
    public static inflow = models.inflow;

    public static async add(
        from: string,
        contractAddress: string,
        amount: string,
        tx: string,
        txAt: Date
    ): Promise<void> {
        const inflowData = {
            from,
            contractAddress,
            amount,
            tx,
            txAt,
            value: amount,
            asset: AssetType.cUSD,
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

    public static async getAllBackers(contractAddress: string): Promise<string[]> {
        const backers = (
            await this.inflow.findAll({
                attributes: [[fn('distinct', col('from')), 'backerAddress']],
                where: { contractAddress },
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
