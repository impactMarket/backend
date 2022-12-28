import { Interface } from '@ethersproject/abi';
import { JsonRpcProvider } from '@ethersproject/providers';

import { config } from '../../..';
import { models, sequelize } from '../../database';

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
                for (let index = 0; index < events.length; index++) {
                    const event = events[index]!;

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
            })
            .catch((error) => {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!

                console.log(error);
            });
    });
    return true;
}