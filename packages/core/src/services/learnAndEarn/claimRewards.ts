import { Interface } from '@ethersproject/abi';
import { JsonRpcProvider } from '@ethersproject/providers';
import { models } from '../../database';
import config from '../../config';

const iface = new Interface(['event RewardClaimed(address indexed beneficiary, uint256 indexed levelId)']);

export async function registerClaimRewards(userId: number, transactionHash: string) {
    const provider = new JsonRpcProvider(config.chain.jsonRPCUrlCelo);

    // data is updated in background
    provider
        .waitForTransaction(transactionHash, 1, 7000)
        .then(async transaction => {
            // in case other unknown events are included on that transaction,
            // ignore them
            const events = transaction.logs.map(log => {
                try {
                    return iface.parseLog(log);
                } catch (_) {
                    return null;
                }
            });

            for (let index = 0; index < events.length; index++) {
                const event = events[index];

                if (event === null) {
                    continue;
                }
                if (event.name !== 'RewardClaimed') {
                    continue;
                }

                await models.learnAndEarnPayment.update(
                    { status: 'paid' },
                    {
                        where: {
                            levelId: event.args.levelId,
                            userId
                        }
                    }
                );
            }
        })
        .catch(error => {
            console.error(error);
        });
    return true;
}
