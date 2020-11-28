import moment from 'moment';
import { Op } from 'sequelize';

import { NotifiedBacker } from '../db/models/notifiedBacker';

export default class NotifiedBackerService {
    public static async add(
        addresses: string[],
        communityId: string
    ): Promise<string[]> {
        const allNotifiedBackers = await NotifiedBacker.findAll({
            where: {
                backer: { [Op.in]: addresses },
                communityId,
            },
        });
        const recentlyNotifiedBackers = allNotifiedBackers
            .filter((n) => moment().diff(n.at, 'days') < 3)
            .map((b) => b.backer);
        const longNotifiedBackers = allNotifiedBackers
            .filter((n) => moment().diff(n.at, 'days') >= 3)
            .map((b) => b.backer);

        const subtract = (arrayOriginal: string[], arraySubtract: string[]) => {
            const hash = Object.create(null);
            arraySubtract.forEach((a) => {
                hash[a] = (hash[a] || 0) + 1;
            });
            return arrayOriginal.filter((a) => {
                return !hash[a] || (hash[a]--, false);
            });
        };
        const neverNotifiedBackers = subtract(
            addresses,
            longNotifiedBackers.concat(recentlyNotifiedBackers)
        );
        neverNotifiedBackers.forEach((b) => {
            NotifiedBacker.create({
                backer: b,
                communityId,
                at: new Date(),
            });
        });
        longNotifiedBackers.forEach((b) => {
            NotifiedBacker.update(
                { at: new Date() },
                {
                    where: {
                        backer: b,
                        communityId,
                    },
                }
            );
        });
        return neverNotifiedBackers.concat(longNotifiedBackers);
    }
}
