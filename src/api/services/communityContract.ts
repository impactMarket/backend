import { col, fn, Op, Transaction } from 'sequelize';
import database from '../loaders/database';
import { CommunityContract } from '../../db/models/communityContract';
import { ICommunityContractParams } from '../../types';

const db = database();
export default class CommunityContractService {
    public static async add(
        communityId: string,
        contractParams: ICommunityContractParams,
        t: Transaction | undefined = undefined
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
        }, { transaction: t });
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
        // TODO: use a script instead
        // select avg(cc."maxClaim")
        // from communitycontract cc, community c
        // where c."publicId" = cc."communityId"
        // and c.status = 'valid'
        // and c.visibility = 'public'
        const publicCommunities: string[] = (await db.models.community.findAll({
            attributes: ['publicId'],
            where: { visibility: 'public', status: 'valid' }
        })).map((c) => c.publicId);

        const result = (await db.models.communityContract.findAll({
            attributes: [
                [fn('avg', col('maxClaim')), 'avgComulativeUbi']
            ],
            where: {
                communityId: { [Op.in]: publicCommunities },
            }
        }))[0];
        return (result as any).avgComulativeUbi;
    }
}
