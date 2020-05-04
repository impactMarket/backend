import { Beneficiary } from '../models/beneficiary';
import CommunityContractABI from '../contracts/CommunityABI.json'
import config from '../config';
import { ethers } from 'ethers';


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
        acceptanceTransaction: string,
        communityPublicId: string,
    ): Promise<boolean> {
        const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
        const receipt = await provider.waitForTransaction(acceptanceTransaction);
        const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);
        if (receipt.logs === undefined) {
            return true;
        }
        const eventsCommunity = receipt.logs.map((log) => ifaceCommunity.parseLog(log));
        const index = eventsCommunity.findIndex((event) => event !== null && event.name === 'BeneficiaryAdded');
        const beneficiaryAddress = eventsCommunity[index].values._account;
        const deleted = await Beneficiary.destroy({ where: { walletAddress: beneficiaryAddress } });
        if (deleted > 0) {
            return true;
        }
        return false;
    }

    public static async findByWallet(walletAddress: string) {
        return Beneficiary.findOne({ where: { walletAddress } });
    }

    public static async findByCommunityId(id: string) {
        return Beneficiary.findAll({ where: { communityPublicId: id } });
    }
}