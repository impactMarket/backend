import { Transaction } from 'sequelize';
import { Manager } from '../db/models/manager';
import database from '../loaders/database';
import { Logger } from '../loaders/logger';


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

    public static async remove(
        address: string,
        communityId: string
    ): Promise<void> {
        await db.models.manager.destroy({ where: { user: address, communityId } });
    }
}