import { col, fn } from 'sequelize';
import database from '../loaders/database';

import { CommunityContract } from '../db/models/communityContract';
import { ICommunityContractParams } from '../types';

const db = database();
export default class CommunityContractService {
    public static async add(
        communityId: string,
        contractParams: ICommunityContractParams
    ): Promise<CommunityContract> {
        const {
            claimAmount,
            maxClaim,
            baseInterval,
            incrementInterval,
        } = contractParams;
        return await db.models.communityContract.create({
            communityId,
            claimAmount,
            maxClaim,
            baseInterval,
            incrementInterval,
        });
    }

    public static async get(
        communityId: string
    ): Promise<ICommunityContractParams> {
        return (await db.models.communityContract.findOne({
            attributes: [
                'claimAmount',
                'maxClaim',
                'baseInterval',
                'incrementInterval',
            ],
            where: { communityId },
        }))!;
    }

    public static async getAll(): Promise<Map<string, CommunityContract>> {
        return new Map(
            (await db.models.communityContract.findAll()).map((c) => [c.communityId, c])
        );
    }

    public static async avgComulativeUbi(): Promise<string> {
        const result = (
            await db.models.communityContract.findAll({
                attributes: [[fn('avg', col('maxClaim')), 'avgComulativeUbi']],
            })
        )[0];
        return (result as any).avgComulativeUbi;
    }
}
