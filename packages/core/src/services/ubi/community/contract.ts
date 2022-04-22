import { models, sequelize } from '../../../database';
import { ICommunityContractParams } from '../../../types';

export default class CommunityContractService {
    public async update(
        communityId: number,
        contractParams: ICommunityContractParams
    ): Promise<boolean> {
        const { claimAmount, maxClaim, baseInterval, incrementInterval } =
            contractParams;

        const community = (await models.community.findOne({
            attributes: ['publicId'],
            where: { id: communityId },
        }))!;
        try {
            await sequelize.transaction(async (t) => {
                await models.ubiCommunityContract.update(
                    {
                        claimAmount,
                        maxClaim,
                        baseInterval,
                        incrementInterval,
                    },
                    { where: { communityId }, transaction: t }
                );

                // TODO: migrate
                await models.ubiRequestChangeParams.destroy({
                    where: { communityId: community.publicId },
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