import { utils, database, subgraph } from '@impactmarket/core';
import { ethers } from 'ethers';

async function calculateBorrowersPerformance(): Promise<void> {
    utils.Logger.info('Updating borrowers performance...');

    // get borrowers
    const { borrowers } = await subgraph.queries.microcredit.getBorrowers({ onlyClaimed: true, loanStatus: 1 });
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
        const performance = Number(amount) / Number(repaid) / (Number(period) / elapsed) * 1000;
        borrowersPerformance.set(userId, performance);
    }
    // update borrowers on database
    try {
        for (const performance of borrowersPerformance) {
            await database.models.microCreditBorrowers.update(
                { performance: Math.trunc(performance[1]) },
                { where: { userId: performance[0] } }
            );
        }
    } catch (error) {
        utils.Logger.error(error);
    }
}

export { calculateBorrowersPerformance };
