import moment from 'moment';
import { Op } from 'sequelize';
import { NotifiedBacker } from '../db/models/notifiedBacker';


export default class NotifiedBackerService {

    public static async add(
        addresses: string[],
        communityId: string
    ): Promise<string[]> {

        const allNotifiedBacker = await NotifiedBacker.findAll({
            where: {
                backer: { [Op.in]: addresses },
                communityId,
            },
            raw: true,
        });
        const recentlyNotifiedBacker = allNotifiedBacker
            .filter((n) => moment().diff(n.at, 'days') < 3)
            .map((b) => b.backer);

        const subtract = (arrayOriginal: string[], arraySubtract: string[]) => {
            let hash = Object.create(null);
            arraySubtract.forEach((a) => {
                hash[a] = (hash[a] || 0) + 1;
            });
            return arrayOriginal.filter((a) => {
                return !hash[a] || (hash[a]--, false);
            });
        }

        const longNotifiedBackers = subtract(addresses, allNotifiedBacker.map((b) => b.backer));
        const neverNotifiedBackers = subtract(longNotifiedBackers, recentlyNotifiedBacker);

        longNotifiedBackers.forEach((b) => {
            NotifiedBacker.create({
                backer: b,
                communityId,
                at: new Date()
            });
        });

        neverNotifiedBackers.forEach((b) => {
            NotifiedBacker.update(
                { at: new Date() },
                {
                    where: {
                        backer: b,
                        communityId
                    }
                });
        });
        return neverNotifiedBackers.concat(longNotifiedBackers);
    }
}