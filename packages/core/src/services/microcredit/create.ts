import { MicroCreditContentStorage } from '../../services/storage';
import { models } from '../../database';

export default class MicroCreditList {
    private microCreditContentStorage = new MicroCreditContentStorage();

    public async getPresignedUrlMedia(mime: string) {
        return this.microCreditContentStorage.getPresignedUrlPutObject(mime);
    }

    // register docs to microCreditDocs table
    public async postDocs(
        userId: number,
        docs: [
            {
                filepath: string;
                category: number;
            }
        ]
    ) {
        const microCreditDocs = docs.map(doc => ({
            ...doc,
            userId
        }));

        await models.microCreditDocs.bulkCreate(microCreditDocs);

        return microCreditDocs;
    }
}
