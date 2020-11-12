import { col, fn } from 'sequelize';
import { CommunityContract } from '../db/models/communityContract';


export default class CommunityContractService {

    public static async getAll(): Promise<Map<string, CommunityContract>> {
        return new Map((await CommunityContract.findAll()).map((c) => [c.communityId, c]));
    }

    public static async avgComulativeUbi(): Promise<string> {
        const result = await CommunityContract.findAll({
            attributes: [
                [fn('avg', col('maxClaim')), 'avgComulativeUbi']
            ],
        });
        return (result as any).avgComulativeUbi;
    }
}