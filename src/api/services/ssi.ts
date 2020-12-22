import { SSI } from '@models/ssi';

export default class SSIService {
    /**
     * @deprecated
     */
    public static async add(
        communityPublicId: string,
        date: Date,
        ssi: number
    ): Promise<SSI> {
        return SSI.create({
            communityPublicId,
            date,
            ssi,
        });
    }

    /**
     * @deprecated
     */
    public static async get(
        communityPublicId: string
    ): Promise<{ dates: Date[]; values: number[] }> {
        const ssis = await SSI.findAll({
            where: { communityPublicId },
            attributes: ['date', 'ssi'],
            order: [['date', 'ASC']],
            raw: true,
        });
        const dates = ssis
            .map((ssi) => ssi.date)
            .slice(Math.max(0, ssis.length - 15), ssis.length);
        const values = ssis
            .map((ssi) => ssi.ssi)
            .slice(Math.max(0, ssis.length - 15), ssis.length);
        return { dates, values };
    }

    /**
     * @deprecated
     */
    public static async last(
        communityPublicId: string
    ): Promise<{ date: Date; value: number } | undefined> {
        const ssi = await SSI.findAll({
            where: { communityPublicId },
            attributes: ['date', 'ssi'],
            limit: 1,
            order: [['date', 'DESC']],
            raw: true,
        });
        if (ssi.length === 0) {
            return undefined;
        }
        return { date: ssi[0].date, value: ssi[0].ssi };
    }
}
