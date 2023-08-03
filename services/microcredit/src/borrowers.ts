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

        const borrowers = await subgraph.queries.microcredit.getBorrowers({ entityLastUpdated });

        const users = await appUser.findAll({
            attributes: ['address', 'id'],
            where: {
                address: borrowers.borrowers.map(el => getAddress(el.id))
            }
        });

        await Promise.all(users.map(user => {
            const borrower = borrowers.borrowers.find(el => el.id === user.address.toLowerCase());
            const values = {
                lastRepayment: borrower!.loan.lastRepayment,
                lastRepaymentAmount: parseFloat(borrower!.loan.lastRepaymentAmount),
                lastDebt: parseFloat(borrower!.loan.lastDebt),
                amount: parseFloat(borrower!.loan.amount),
                period: borrower!.loan.period,
                claimed: borrower!.loan.claimed,
            };

            return subgraphMicroCreditBorrowers
                .findOne({ where: { userId: user.id } })
                .then(subgraphBorrower => {
                    if(subgraphBorrower)
                        return subgraphBorrower.update(values, { transaction: t });
                    return subgraphMicroCreditBorrowers.create({ userId: user.id, ...values }, { transaction: t });
                })
        }));

        await t.commit();
        utils.Logger.info('Borrowers updated!');
    } catch (error) {
        await t.rollback();
        utils.Logger.error('Error update borrowers: ', error);
        utils.slack.sendSlackMessage('🚨 Error to update borrowers', config.slack.lambdaChannel);
    }
}
