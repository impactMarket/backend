import { models } from '../../database';
import config from '../../config';

export default class ImMetadataService {
    public static imMetadata = models.imMetadata;

    public static async setLastBlock(value: number): Promise<void> {
        await this.imMetadata.update({ value: value.toString() }, { where: { key: 'lastBlock' } });
    }

    public static async getLastBlock(): Promise<number> {
        const last = await this.imMetadata.findOne({
            where: { key: 'lastBlock' },
            raw: true
        });
        if (last === null) {
            return config.impactMarketContractBlockNumber;
        }
        return parseInt(last.value, 10);
    }

    public static async setRecoverBlockUsingLastBlock(): Promise<void> {
        const value = await ImMetadataService.getLastBlock();
        try {
            // if the key already exists, it might be because it's failing
            // a couple times in a row. It should not update to the last block
            // or will lose blocks, since the system is already syncing
            await this.imMetadata.create({
                value: value.toString(),
                key: 'recoverBlock'
            });
        } catch (e) {
            //
        }
    }

    public static async getRecoverBlock(): Promise<number> {
        const last = await this.imMetadata.findOne({
            where: { key: 'recoverBlock' },
            raw: true
        });
        if (last === null) {
            return await ImMetadataService.getLastBlock();
        }
        return parseInt(last.value, 10);
    }

    public static async removeRecoverBlock(): Promise<void> {
        await this.imMetadata.destroy({
            where: { key: 'recoverBlock' }
        });
    }
}
