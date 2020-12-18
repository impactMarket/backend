import { col, fn, Op, Transaction } from 'sequelize';
import { Manager } from '../db/models/manager';
import database from '../loaders/database';
import { Logger } from '../loaders/logger';
import { IManagerDetailsManager } from '../types/endpoints';


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

    public static async countManagers(
        communityId: string,
    ): Promise<number> {
        const managers: { total: number } = (await db.models.manager.findAll({
            attributes: [
                [fn('count', col('user')), 'total']
            ],
            where: { communityId }
        }))[0] as any;
        return managers.total;
    }

    public static async listManagers(
        communityId: string,
    ): Promise<IManagerDetailsManager[]> {
        // TODO: this needs to be improved with eager loading (I mean, a lot!)
        const managers: IManagerDetailsManager[] = [];
        const bAddresses: string[] = []
        // select m."user" address, u.username username from manager m left join "user" u on u.address = m."user"
        const manager = await db.models.manager.findAll({ where: { communityId } });
        bAddresses.concat(manager.map((a) => a.user));
        const names = await db.models.user.findAll({
            attributes: ['address', 'username'],
            where: {
                address: {
                    [Op.in]: bAddresses
                },
            },
        });
        for (let index = 0; index < manager.length; index++) {
            const e = manager[index];
            const u = names.find((n) => n.address === e.user);
            managers.push({
                address: e.user,
                username: u ? u.username : null,
                timestamp: e.createdAt.getTime(), // TODO: do not depend on createdAt
            });
        }
        return managers;
    }

    public static async remove(
        address: string,
        communityId: string
    ): Promise<void> {
        await db.models.manager.destroy({ where: { user: address, communityId } });
    }
}