import { ReachedAddress } from '../db/models/reachedAddress';
import Logger from '../loaders/logger';


export default class ReachedAddressService {

    public static async addNewReachedToday(
        addresses: string[],
    ): Promise<void> {
        // TODO: improve
        try {
            for (let index = 0; index < addresses.length; index++) {
                await ReachedAddress.upsert({
                    address: addresses[index],
                    lastInteraction: new Date(),
                });
            }
        } catch (e) {
            Logger.info(e);
        }
    }
}