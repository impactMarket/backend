import { Claim } from '../db/models/claim';
import Logger from '../loaders/logger';


export default class ClaimsService {

    public static async add(
        address: string,
        communityId: string,
        amount: string,
        tx: string,
    ): Promise<void> {
        try {
            await Claim.create({
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