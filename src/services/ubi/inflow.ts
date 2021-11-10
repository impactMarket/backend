import { InflowAttributes, InflowCreationAttributes } from '@models/ubi/inflow';
import { Logger } from '@utils/logger';
import { col, CreateOptions, fn } from 'sequelize';

import { models } from '../../database';
export default class InflowService {
    public static inflow = models.inflow;

    public static async add(
        values: InflowCreationAttributes,
        options?: CreateOptions<InflowAttributes>
    ): Promise<void> {
        try {
            await this.inflow.create(values, options);
        } catch (e) {
            if (e.name !== 'SequelizeUniqueConstraintError') {
                Logger.error(
                    'Error inserting new Inflow. Data = ' +
                        JSON.stringify(values)
                );
                Logger.error(e);
            }
        }
    }

    public static async getAllBackers(
        contractAddress: string
    ): Promise<string[]> {
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
