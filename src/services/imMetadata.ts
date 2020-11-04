import { ImMetadata } from '../db/models/imMetadata';


export default class ImMetadataService {

    public static async setLastBlock(
        value: number,
    ): Promise<void> {
        await ImMetadata.update({ value: value.toString() }, { where: { key: 'lastBlock' } });
    }

    public static async getLastBlock(): Promise<number> {
        const last = await ImMetadata.findOne({ where: { key: 'lastBlock' }, raw: true });
        return parseInt(last!.value);
    }

    public static async setQueryFilterLastBlock(
        value: number,
    ): Promise<void> {
        await ImMetadata.update({ value: value.toString() }, { where: { key: 'queryFilterLastBlock' } });
    }

    public static async getQueryFilterLastBlock(): Promise<number> {
        const last = await ImMetadata.findOne({ where: { key: 'queryFilterLastBlock' }, raw: true });
        return parseInt(last!.value);
    }
}