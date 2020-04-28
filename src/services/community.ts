import { Community } from '../models/community';


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
        status: string,
    ) {
        return Community.create({
            requestByAddress,
            name,
            description,
            location,
            coverImage,
            status,
        });
    }

    public static async accept(acceptedByAddress: string, id: string) {
        // TODO: 
        // * submit transaction.
        // * If successful run changes on db
        // * get contract address and set it in database
        return true;
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

    public static async findById(id: string) {
        return Community.findOne({ where: { publicId: id } });
    }
}