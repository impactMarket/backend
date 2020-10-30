import { Claims } from '../db/models/claims';
import Logger from '../loaders/logger';


export default class ClaimsService {

    public static async add(
        address: string,
        communityId: string,
        amount: string,
        tx: string,
    ): Promise<void> {
        try {
            await Claims.create({
                address,
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