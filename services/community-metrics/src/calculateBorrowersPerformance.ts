import { config, database, subgraph, utils } from '@impactmarket/core';
import { ethers } from 'ethers';

async function calculateBorrowersPerformance(): Promise<void> {
    try {
        utils.Logger.info('Updating borrowers performance...');

        // get borrowers
        const totalBorrowers = await subgraph.queries.microcredit.countGetBorrowers({
            loanStatus: 1
        });
        utils.Logger.info(`Total borrowers: ${totalBorrowers}`);
        const loops = Math.ceil(totalBorrowers / 200);
        const borrowers: {
            id: string;
            loan: {
                amount: string;
                period: number;
                dailyInterest: number;
                claimed: number;
                repaid: string;
                lastRepayment: number;
                lastRepaymentAmount: string;
                lastDebt: string;
            };
        }[] = [];
        for (let i = 0; i < loops; i++) {
            const { borrowers: batchBorrowers } = await subgraph.queries.microcredit.getBorrowers({
                onlyClaimed: true,
                loanStatus: 1,
                offset: i * 200,
                limit: 200
            });
            borrowers.push(...batchBorrowers);
        }
        // get user id from borrower address
        const rawUsers = await database.models.appUser.findAll({
            where: { address: borrowers.map(b => ethers.utils.getAddress(b.id)) }
        });
        const users = new Map(rawUsers.map(u => [u.address.toLowerCase(), u.id]));
        // calculate performance with data from subgraph "(repaid / borrowed) / (period / elapsed time since claimed)""
        const borrowersPerformance = new Map<number, number>();
        for (const borrower of borrowers) {
            const userId = users.get(borrower.id.toLowerCase());
            if (!userId) {
                utils.Logger.warn(`User ${borrower.id} not found`);
                continue;
            }
            const { repaid, amount, claimed, period } = borrower.loan;
            const elapsed = Date.now() / 1000 - claimed;
            const performance =
                (parseFloat(repaid) /
                    parseFloat(amount) /
                    (Math.round(elapsed / 86400) / Math.round(period / 86400))) *
                100;
            borrowersPerformance.set(userId, performance);
        }
        // update borrowers on database
        for (const borrowerPerformance of borrowersPerformance) {
            if (borrowerPerformance[1] === Infinity) continue;
            if (Number.isNaN(borrowerPerformance[1])) continue;

            await database.models.microCreditBorrowers.update(
                { performance: Math.trunc(borrowerPerformance[1]) },
                { where: { userId: borrowerPerformance[0] } }
            );
        }
        utils.Logger.info('Updated borrowers performance!');
    } catch (error) {
        utils.Logger.error('Error calculateBorrowersPerformance: ', error);
        utils.slack.sendSlackMessage('🚨 Error to calculate borrowers performance', config.slack.lambdaChannel);
    }
}

export { calculateBorrowersPerformance };
