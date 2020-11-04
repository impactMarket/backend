import { CommunityContract } from '../db/models/communityContract';


export default class CommunityContractService {

    public static async getAll(): Promise<Map<string, CommunityContract>> {
        return new Map((await CommunityContract.findAll()).map((c) => [c.communityId, c]));
    }
}