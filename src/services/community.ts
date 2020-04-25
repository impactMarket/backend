import { Community } from '../models/community';


export default class CommunityService {
    public static async add(
        walletAddress: string,
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
            walletAddress,
            name,
            description,
            location,
            coverImage,
            status,
        });
    }

    public static async accept(id: string) {
        // TODO: only admins
        return undefined;
    }

    public static async getAll(status: string = 'all') {
        if (status === 'all') {
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