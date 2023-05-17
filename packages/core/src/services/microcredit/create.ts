import { MicroCreditContentStorage } from '../../services/storage';

export default class MicroCreditList {
    private microCreditContentStorage = new MicroCreditContentStorage();

    public async getPresignedUrlMedia(mime: string) {
        return this.microCreditContentStorage.getPresignedUrlPutObject(mime);
    }
}
