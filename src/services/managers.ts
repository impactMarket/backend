import { Op } from 'sequelize';
import { Manager } from '../db/models/manager';


export default class ManagerService {

    public static async add(
        address: string,
        communityId: string
    ): Promise<boolean> {
        // if user does not exist, add to pending list
        // otherwise update
        const user = await Manager.findOne({ where: { user: address, communityId } });
        if (user === null) {
            const updated = await Manager.create({
                user: address,
                communityId
            });
            return updated[0] > 0;
        }
        return true;
    }


    public static async get(
        address: string,
    ): Promise<Manager | null> {
        return await Manager.findOne({ where: { user: address } });
    }

    public static async remove(
        address: string,
        communityId: string
    ): Promise<void> {
        await Manager.destroy({ where: { user: address, communityId } });
    }
}