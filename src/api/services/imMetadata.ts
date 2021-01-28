import config from '../../config';
import { models, sequelize } from '../../database';

// const db = database();
export default class ImMetadataService {
    public static imMetadata = models.imMetadata;

    public static async setLastBlock(value: number): Promise<void> {
        await this.imMetadata.update(
            { value: value.toString() },
            { where: { key: 'lastBlock' } }
        );
    }

    public static async getLastBlock(): Promise<number> {
        const last = await this.imMetadata.findOne({
            where: { key: 'lastBlock' },
            raw: true,
        });
        if (last === null) {
            return config.impactMarketContractBlockNumber;
        }
        return parseInt(last.value);
    }
}
