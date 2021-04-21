import { Manager } from '@models/ubi/manager';
import { Logger } from '@utils/logger';
import { isAddress, isUUID } from '@utils/util';
import { col, fn, QueryTypes, Transaction } from 'sequelize';

import { models, sequelize } from '../../database';
import { IManagerDetailsManager } from '../../types/endpoints';

export default class ManagerService {
    public static manager = models.manager;
    public static sequelize = sequelize;

    public static async add(
        address: string,
        communityId: string,
        t: Transaction | undefined = undefined
    ): Promise<boolean> {
        // if user does not exist, add to pending list
        // otherwise update
        const user = await this.manager.findOne({
            where: { address, communityId },
            raw: true,
        });
        if (user === null) {
            const managerData = {
                address,
                communityId,
            };
            try {
                const updated = await this.manager.create(managerData, {
                    transaction: t,
                });
                return updated[0] > 0;
            } catch (e) {
                if (e.name !== 'SequelizeUniqueConstraintError') {
                    Logger.error(
                        'Error inserting new Manager. Data = ' +
                            JSON.stringify(managerData)
                    );
                    Logger.error(e);
                }
                return false;
            }
        }
        return true;
    }

    public static async get(address: string): Promise<Manager | null> {
        return await this.manager.findOne({
            where: { address },
            raw: true,
        });
    }

    /**
     * @deprecated Since mobile version 0.1.8
     */
    public static async countManagers(communityId: string): Promise<number> {
        const managers: { total: string } = (
            await this.manager.findAll({
                attributes: [[fn('count', col('user')), 'total']],
                where: { communityId },
                raw: true,
            })
        )[0] as any;
        return parseInt(managers.total, 10);
    }

    /**
     * @deprecated Since mobile version 0.1.8
     */
    public static async managersInCommunity(
        communityId: string
    ): Promise<IManagerDetailsManager[]> {
        // select m."user" address, u.username username, m."createdAt" "timestamp"
        // from manager m left join "user" u on u.address = m."user"

        if (!isUUID(communityId)) {
            throw new Error('Not valid UUID ' + communityId);
        }

        return await this.sequelize.query(
            'select m."user" address, u.username username, m."createdAt" "timestamp" from manager m left join "user" u on u.address = m."user" where m."communityId" = \'' +
                communityId +
                '\' order by m."createdAt" desc',
            { type: QueryTypes.SELECT }
        );
    }

    public static async search(
        managerAddress: string,
        address: string
    ): Promise<IManagerDetailsManager[]> {
        // select mq."user" address, u.username username, mq."createdAt" "timestamp"
        // from manager m, manager mq
        //     left join "user" u on u.address = mq."user"
        // where m."communityId" = mq."communityId"
        // and m."user" = '0x833961aab38d24EECdCD2129Aa5a5d41Fd86Acbf'
        // and mq."user" = '0x64771E37aA6cD3AeD0660fee96F6651CE4d1E3a5'
        // order by mq."createdAt" desc

        if (!isAddress(managerAddress)) {
            throw new Error('Not a manager ' + managerAddress);
        }

        return await this.sequelize.query(
            'select mq."user" address, u.username username, mq."createdAt" "timestamp" from manager m, manager mq left join "user" u on u.address = mq."user" where m."communityId" = mq."communityId" and m."user" = \'' +
                managerAddress +
                '\'  and mq."user" = \'' +
                address +
                '\' order by mq."createdAt" desc',
            { type: QueryTypes.SELECT }
        );
    }

    public static async listManagers(
        managerAddress: string,
        offset: number,
        limit: number
    ): Promise<IManagerDetailsManager[]> {
        // select mq."user" address, u.username username, mq."createdAt" "timestamp"
        // from manager m, manager mq
        //     left join "user" u on u.address = mq."user"
        // where m."communityId" = mq."communityId"
        // and m."user" = '0x833961aab38d24EECdCD2129Aa5a5d41Fd86Acbf'
        // order by mq."createdAt" desc
        // offset 0
        // limit 10

        if (!isAddress(managerAddress)) {
            throw new Error('Not a manager ' + managerAddress);
        }

        return await this.sequelize.query(
            'select mq."user" address, u.username username, mq."createdAt" "timestamp" from manager m, manager mq left join "user" u on u.address = mq."user" where m."communityId" = mq."communityId" and m."user" = \'' +
                managerAddress +
                '\' order by mq."createdAt" desc offset ' +
                offset +
                ' limit ' +
                limit,
            { type: QueryTypes.SELECT }
        );
    }

    public static async remove(
        address: string,
        communityId: string
    ): Promise<void> {
        await this.manager.destroy({
            where: { address, communityId },
        });
    }
}
