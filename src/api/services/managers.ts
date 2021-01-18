import { col, fn, Op, QueryTypes, Transaction } from 'sequelize';
import { Manager } from '@models/manager';
import database from '../loaders/database';
import { Logger } from '@logger/logger';
import { IManagerDetailsManager } from '../../types/endpoints';
import { isAddress, isUUID } from '../../utils';


const db = database();
export default class ManagerService {

    public static async add(
        address: string,
        communityId: string,
        t: Transaction | undefined = undefined
    ): Promise<boolean> {
        // if user does not exist, add to pending list
        // otherwise update
        const user = await db.models.manager.findOne({ where: { user: address, communityId } });
        if (user === null) {
            const managerData = {
                user: address,
                communityId
            };
            try {
                const updated = await db.models.manager.create(managerData, { transaction: t });
                return updated[0] > 0;
            } catch (e) {
                if (e.name !== 'SequelizeUniqueConstraintError') {
                    Logger.error('Error inserting new Manager. Data = ' + JSON.stringify(managerData));
                    Logger.error(e);
                }
                return false;
            }
        }
        return true;
    }

    public static async get(
        address: string,
    ): Promise<Manager | null> {
        return await db.models.manager.findOne({ where: { user: address } });
    }

    /**
     * @deprecated Since mobile version 0.1.8
     */
    public static async countManagers(
        communityId: string,
    ): Promise<number> {
        const managers: { total: string } = (await db.models.manager.findAll({
            attributes: [
                [fn('count', col('user')), 'total']
            ],
            where: { communityId }
        }))[0] as any;
        return parseInt(managers.total, 10);
    }

    /**
     * @deprecated Since mobile version 0.1.8
     */
    public static async managersInCommunity(
        communityId: string,
    ): Promise<IManagerDetailsManager[]> {
        // select m."user" address, u.username username, m."createdAt" "timestamp"
        // from manager m left join "user" u on u.address = m."user"

        if (!isUUID(communityId)) {
            throw new Error('Not valid UUID ' + communityId);
        }

        return await db.sequelize.query("select m.\"user\" address, u.username username, m.\"createdAt\" \"timestamp\" from manager m left join \"user\" u on u.address = m.\"user\" where m.\"communityId\" = '" + communityId + "' order by m.\"createdAt\" desc", { type: QueryTypes.SELECT });
    }

    public static async listManagers(
        managerAddress: string,
        offset: number,
        limit: number,
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

        const managers: IManagerDetailsManager[] = await db.sequelize.query("select mq.\"user\" address, u.username username, mq.\"createdAt\" \"timestamp\" from manager m, manager mq left join \"user\" u on u.address = mq.\"user\" where m.\"communityId\" = mq.\"communityId\" and m.\"user\" = '" + managerAddress + "' order by mq.\"createdAt\" desc offset " + offset + " limit " + limit, { type: QueryTypes.SELECT });

        return managers;
    }

    public static async remove(
        address: string,
        communityId: string
    ): Promise<void> {
        await db.models.manager.destroy({ where: { user: address, communityId } });
    }
}