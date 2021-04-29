import { UbiCommunityContract } from '@interfaces/ubi/ubiCommunityContract';
import { col, fn, Op, Transaction } from 'sequelize';

import { models, sequelize } from '../../database';
import { ICommunityContractParams } from '../../types';

export default class CommunityContractService {
    public static ubiCommunityContract = models.ubiCommunityContract;
    public static ubiRequestChangeParams = models.ubiRequestChangeParams;
    public static community = models.community;
    public static sequelize = sequelize;

    public static async add(
        communityId: number,
        contractParams: ICommunityContractParams,
        t: Transaction | undefined = undefined
    ): Promise<UbiCommunityContract> {
        const {
            claimAmount,
            maxClaim,
            baseInterval,
            incrementInterval,
        } = contractParams;
        return await this.ubiCommunityContract.create(
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
        communityId: number,
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
                await this.ubiCommunityContract.update(
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
}
