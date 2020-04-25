import { Beneficiary } from '../models/beneficiary';


export default class BeneficiaryService {
    public static async request(
        walletAddress: string,
        communityPublicId: string,
    ) {
        return Beneficiary.create({
            walletAddress,
            communityPublicId,
        });
    }

    public static async accept(
        walletAddress: string,
        communityPublicId: string,
    ) {
        // TODO: only admins
        return undefined;
    }

    public static async findByWallet(walletAddress: string) {
        return Beneficiary.findOne({ where: { walletAddress } });
    }

    public static async findByCommunityId(id: string) {
        return Beneficiary.findOne({ where: { communityPublicId: id } });
    }
}