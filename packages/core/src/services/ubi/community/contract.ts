import { Transaction } from 'sequelize';

import { ICommunityContractParams } from '../../../types';
import { UbiCommunityContract } from '../../../interfaces/ubi/ubiCommunityContract';
import { models, sequelize } from '../../../database';

export default class CommunityContractService {
    public async add(
        communityId: number,
        contractParams: ICommunityContractParams,
        t: Transaction | undefined = undefined
    ): Promise<UbiCommunityContract> {
        const { claimAmount, maxClaim, decreaseStep, baseInterval, incrementInterval } = contractParams;

        return models.ubiCommunityContract.create(
            {
                communityId,
                claimAmount: claimAmount as number,
                maxClaim: maxClaim as number,
                decreaseStep: decreaseStep as number,
                baseInterval,
                incrementInterval
            },
            { transaction: t }
        );
    }

    public async update(communityId: number, contractParams: ICommunityContractParams): Promise<boolean> {
        const { claimAmount, maxClaim, decreaseStep, baseInterval, incrementInterval } = contractParams;

        try {
            await sequelize.transaction(async t => {
                await models.ubiCommunityContract.update(
                    {
                        claimAmount: claimAmount as number,
                        maxClaim: maxClaim as number,
                        decreaseStep: decreaseStep as number,
                        baseInterval,
                        incrementInterval
                    },
                    {
                        where: { communityId },
                        transaction: t
                    }
                );
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
