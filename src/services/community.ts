import { Community } from '../models/community';
import { CommunityCreation } from '../models/communityCreation';
import { ethers } from 'ethers';
import { uuid } from 'uuidv4';
import config from '../config';
import ImpactMarketContractABI from '../contracts/ImpactMarketABI.json'


export default class CommunityService {
    public static async request(
        requestByAddress: string,
        name: string,
        description: string,
        location: {
            title: string,
            latitude: number,
            longitude: number,
        },
        coverImage: string,
        amountByClaim: number,
        baseInterval: number,
        incrementalInterval: number,
        claimHardcap: number,
    ) {
        const publicId = uuid();
        // TODO: fix
        // await CommunityCreation.create({
        //     publicId,
        //     amountByClaim,
        //     baseInterval,
        //     incrementalInterval,
        //     claimHardcap,
        // });
        return Community.create({
            publicId,
            requestByAddress,
            name,
            description,
            location,
            coverImage,
            status: 'pending',
        });
    }

    public static async accept(acceptanceTransaction: string, publicId: string): Promise<boolean> {
        const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
        const receipt = await provider.waitForTransaction(acceptanceTransaction);
        const ifaceImpactMarket = new ethers.utils.Interface(ImpactMarketContractABI);
        if (receipt.logs === undefined) {
            return true;
        }
        const eventsImpactMarket = receipt.logs.map((log) => ifaceImpactMarket.parseLog(log));
        const index = eventsImpactMarket.findIndex((event) => event !== null && event.name === 'CommunityAdded');
        const communityContractAddress = eventsImpactMarket[index].values._addr;
        const dbUpdate: [number, Community[]] = await Community.update(
            { contractAddress: communityContractAddress, status: 'valid' },
            { returning: true, where: { publicId } },
        );
        if (dbUpdate[0] === 1) {
            return true;
        }
        return false;
    }

    public static async getAll(status?: string) {
        if (status === undefined) {
            return Community.findAll();
        }
        return Community.findAll({ where: { status } });
    }

    public static async findByWallet(walletAddress: string) {
        return Community.findOne({ where: { walletAddress } });
    }

    public static async findById(publicId: string) {
        return Community.findOne({ where: { publicId } });
    }
}