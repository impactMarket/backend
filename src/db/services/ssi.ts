import { SSI } from '../models/ssi';


export default class SSIService {
    public static async add(
        communityPublicId: string,
        date: Date,
        ssi: number,
    ): Promise<SSI> {
        return SSI.create({
            communityPublicId,
            date,
            ssi
        });
    }

    public static async get(
        communityPublicId: string,
    ): Promise<{ dates: Date[], values: number[] }> {
        const ssis = await SSI.findAll({ where: { communityPublicId }, attributes: ['date', 'ssi'], raw: true });
        const dates = ssis.map((ssi) => ssi.date).slice(Math.max(0, ssis.length - 15), ssis.length);
        const values = ssis.map((ssi) => ssi.ssi).slice(Math.max(0, ssis.length - 15), ssis.length);
        return { dates, values };
    }
}