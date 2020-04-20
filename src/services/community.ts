import { Community } from '../models/community';


export default class CommunityService {
    public static async add(walletAddress: string, name: string) {
        return Community.create({ walletAddress, name });
    }

    public static async getAll() {
        return Community.findAll();
    }

    public static async get(walletAddress: string) {
        return Community.findOne({ where: { walletAddress } });
    }
}