import { Inflow } from '../db/models/inflow';
import Logger from '../loaders/logger';


export default class InflowService {

    public static async add(
        from: string,
        communityId: string,
        amount: string,
        tx: string,
    ): Promise<void> {
        try {
            await Inflow.create({
                from,
                communityId,
                amount,
                tx,
                txAt: new Date(),
            });
        } catch(e) {
            Logger.info(e);
        }
    }
}