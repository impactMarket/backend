import { database, utils, subgraph, config } from '@impactmarket/core';
import { getAddress } from '@ethersproject/address';

export async function updateBorrowers(): Promise<void> {
    utils.Logger.info('Updating borrowers...');
    const { subgraphMicroCreditBorrowers, appUser } = database.models;
    const t = await database.sequelize.transaction();
    try {
        const lastUpdate = await subgraphMicroCreditBorrowers.findOne({
            attributes: ['updatedAt'],
            order: [['updatedAt', 'DESC']]
        });

        const entityLastUpdated = lastUpdate ? (lastUpdate.updatedAt.getTime() / 1000) | 0 : undefined;

        const borrowers = await subgraph.queries.microcredit.getBorrowers({ entityLastUpdated, limit: 1000 });

        const users = await appUser.findAll({
            attributes: ['address', 'id'],
            where: {
                address: borrowers.borrowers.map(el => getAddress(el.id))
            }
        });

        const batch = config.cronJobBatchSize;
        // batch to avoid "to many connections" error
        for (let i = 0; ; i += batch) {
            const userBatch = users.slice(i, i + batch);
            await Promise.all(userBatch.map(user => {
                const borrower = borrowers.borrowers.find(el => el.id === user.address.toLowerCase());
                const values = {
                    lastRepayment: borrower!.loan.lastRepayment,
                    lastRepaymentAmount: borrower!.loan.lastRepaymentAmount ? parseFloat(borrower!.loan.lastRepaymentAmount) : 0,
                    lastDebt: parseFloat(borrower!.loan.lastDebt),
                    amount: parseFloat(borrower!.loan.amount),
                    // prevent integer overflows
                    period: borrower!.loan.period < 99999999 ? borrower!.loan.period : 0,
                    claimed: borrower!.loan.claimed,
                    dailyInterest: borrower!.loan.dailyInterest,
                    repaid: parseFloat(borrower!.loan.repaid),
                    status: borrower!.loan.status
                };

                return subgraphMicroCreditBorrowers
                    .findOne({ where: { userId: user.id } })
                    .then(subgraphBorrower => {
                        if(subgraphBorrower)
                            return subgraphBorrower.update(values, { transaction: t });
                        return subgraphMicroCreditBorrowers.create({ userId: user.id, ...values }, { transaction: t });
                    })
            }));

            if (i + batch > users.length) {
                break;
            }
        }

        await t.commit();
        utils.Logger.info('Borrowers updated!');
    } catch (error) {
        await t.rollback();
        utils.Logger.error('Error update borrowers: ', error);
        utils.slack.sendSlackMessage('🚨 Error to update borrowers', config.slack.lambdaChannel);
    }
}
