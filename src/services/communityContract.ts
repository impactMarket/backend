import { CommunityContract } from '@models/communityContract';
import { col, fn, Op, Transaction } from 'sequelize';

import { models, sequelize } from '../database';
import { ICommunityContractParams } from '../types';

export default class CommunityContractService {
    public static communityContract = models.communityContract;
    public static ubiRequestChangeParams = models.ubiRequestChangeParams;
    public static community = models.community;
    public static sequelize = sequelize;

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

    public static async update(
        communityId: string,
        contractParams: ICommunityContractParams
    ): Promise<boolean> {
        const {
            claimAmount,
            maxClaim,
            baseInterval,
            incrementInterval,
        } = contractParams;

        try {
            await sequelize.transaction(async (t) => {
                await this.communityContract.update(
                    {
                        claimAmount,
                        maxClaim,
                        baseInterval,
                        incrementInterval,
                    },
                    { where: { communityId }, transaction: t }
                );

                await this.ubiRequestChangeParams.destroy({
                    where: { communityId },
                    transaction: t,
                });
            });
            return true;

            // If the execution reaches this line, the transaction has been committed successfully
            // `result` is whatever was returned from the transaction callback (the `user`, in this case)
        } catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            return false;
        }
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
        }))!;
    }

    public static async getAll(): Promise<Map<string, CommunityContract>> {
        return new Map(
            (await this.communityContract.findAll()).map((c) => [
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
            })
        ).map((c) => c.publicId);

        const result = (
            await this.communityContract.findAll({
                attributes: [[fn('avg', col('maxClaim')), 'avgComulativeUbi']],
                where: {
                    communityId: { [Op.in]: publicCommunities },
                },
            })
        )[0];
        return (result as any).avgComulativeUbi;
    }
}
