import { col, fn } from 'sequelize';
import { ReachedAddress } from '../db/models/reachedAddress';

export default class ReachedAddressService {

    public static async getAllReachedEver(): Promise<number> {
        const result = await ReachedAddress.findAll({
            attributes: [[fn('count', col('address')), 'total']],
        });
        const existingAddresses = (result[0] as any);
        return existingAddresses.total;
    }
}