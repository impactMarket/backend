import config from '../../config';
import database from '../loaders/database';

const db = database();
export default class ImMetadataService {
    public static async setLastBlock(value: number): Promise<void> {
        await db.models.imMetadata.update(
            { value: value.toString() },
            { where: { key: 'lastBlock' } }
        );
    }

    public static async getLastBlock(): Promise<number> {
        const last = await db.models.imMetadata.findOne({
            where: { key: 'lastBlock' },
            raw: true,
        });
        if (last === null) {
            return config.impactMarketContractBlockNumber;
        }
        return parseInt(last.value);
    }
}
