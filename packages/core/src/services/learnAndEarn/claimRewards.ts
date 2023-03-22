import { Interface } from '@ethersproject/abi';
import { JsonRpcProvider } from '@ethersproject/providers';

import { config } from '../../..';
import { models, sequelize } from '../../database';
import { fn, col } from 'sequelize';

const iface = new Interface([
    'event RewardClaimed(address indexed beneficiary, uint256 indexed levelId)',
]);

export async function registerClaimRewards(
    userId: number,
    transactionHash: string
) {
    const provider = new JsonRpcProvider(config.jsonRpcUrl);

    // data is updated in background
    provider.waitForTransaction(transactionHash).then((transaction) => {
        // in case other unknown events are included on that transaction,
        // ignore them
        const events = transaction.logs.map((log) => {
            try {
                return iface.parseLog(log);
            } catch (_) {
                return null;
            }
        });

        sequelize
            .transaction(async (t) => {
                let levelId: number;
                for (let index = 0; index < events.length; index++) {
                    const event = events[index];

                    if (event === null) {
                        continue;
                    }
                    if (event.name !== 'RewardClaimed') {
                        continue;
                    }

                    levelId = event.args.levelId;
                    await models.learnAndEarnPayment.update(
                        { status: 'paid' },
                        {
                            where: {
                                levelId: event.args.levelId,
                                userId,
                            },
                            transaction: t,
                        }
                    );
                }
                // If the execution reaches this line, the transaction has been committed successfully
                checkAvailableReward(levelId!)
            })
            .catch((error) => {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!

                console.log(error);
            });
    });
    return true;
}

const checkAvailableReward = async (levelId: number) => {
    const level = await models.learnAndEarnLevel.findOne({
        attributes: ['rewardLimit', 'totalReward'],
        where: {
            id: levelId,
        }
    });

    if (!level?.rewardLimit) {
        return;
    }

    const payments = await models.learnAndEarnPayment.sum('amount', {
        where: {
            levelId,
            status: 'paid'
        }
    });

    if (!payments) {
        return;
    }

    if (level.rewardLimit <= (payments + level.totalReward)) {
        // do not have funds to a next payment
        await models.learnAndEarnPayment.destroy({
            where: {
                status: 'pending',
                levelId,
            }
        });
    }
}
