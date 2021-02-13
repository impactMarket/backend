import { CommunityContract } from '@models/communityContract';
import { col, fn, Op, Transaction } from 'sequelize';

import { models } from '../database';
import { ICommunityContractParams } from '../types';

export default class CommunityContractService {
    public static communityContract = models.communityContract;
    public static community = models.community;

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
        return await this.communityContract.create(
            {
                communityId,
                claimAmount,
                maxClaim,
                baseInterval,
                incrementInterval,
            },
            { transaction: t }
        );
    }

    public static async get(
        communityId: string
    ): Promise<ICommunityContractParams> {
        return (await this.communityContract.findOne({
            attributes: [
                'claimAmount',
                'maxClaim',
                'baseInterval',
                'incrementInterval',
            ],
            where: { communityId },
            raw: true,
        }))!;
    }

    public static async getAll(): Promise<Map<string, CommunityContract>> {
        return new Map(
            (await this.communityContract.findAll({ raw: true })).map((c) => [
                c.communityId,
                c,
            ])
        );
    }

    public static async avgComulativeUbi(): Promise<string> {
        // TODO: use a script instead
        // select avg(cc."maxClaim")
        // from communitycontract cc, community c
        // where c."publicId" = cc."communityId"
        // and c.status = 'valid'
        // and c.visibility = 'public'
        const publicCommunities: string[] = (
            await this.community.findAll({
                attributes: ['publicId'],
                where: { visibility: 'public', status: 'valid' },
                raw: true,
            })
        ).map((c) => c.publicId);

        const result = (
            await this.communityContract.findAll({
                attributes: [[fn('avg', col('maxClaim')), 'avgComulativeUbi']],
                where: {
                    communityId: { [Op.in]: publicCommunities },
                },
                raw: true,
            })
        )[0];
        return (result as any).avgComulativeUbi;
    }
}
