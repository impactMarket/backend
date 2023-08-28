import { Sequelize } from 'sequelize';
import { SinonSpy, restore, spy, assert } from 'sinon';
import { expect } from 'chai';

import { interfaces, database, tests } from '@impactmarket/core';
import { notification } from '../handler';
import * as sendNotification from '../src/notification';

describe('notification lambda', () => {
    let users: interfaces.app.appUser.AppUser[];
    let sequelize: Sequelize;
    let spySendNotification: SinonSpy;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const { MICROCREDIT_WELCOME, LOAN_UNPAID, HIGH_PERFORMANCE, LOW_PERFORMANCE, REMINDER_LOAN_INTEREST } = interfaces.app.appNotification.NotificationType;
    const { APPROVED } = interfaces.microcredit.microCreditApplications.MicroCreditApplicationStatus;    


    before(async () => {
        users = await tests.factories.UserFactory({ n: 5 });
        sequelize = tests.config.setup.sequelizeSetup();
        await sequelize.sync();
        spySendNotification = spy(sendNotification, '_sendPushNotification');

        // create cenarios
        // user[0] = welcome notification
        // user[1] = high performance
        // user[2] = low performance
        // user[3] = unpaid loan
        // user[4] = increasing interest
        const promises = users.map(async (user, idx) => {
            await database.models.microCreditApplications.create({
                userId: user.id,
                decisionOn: idx === 0 ? oneWeekAgo : twoMonthsAgo,
                status: APPROVED
            });

            if (idx !== 0) {
                // only user 0 should receive the welcome notification
                await database.models.appNotification.create({
                    userId: user.id,
                    type: MICROCREDIT_WELCOME
                });
            }

            const period = 86400 * 30 * 4 // period of 4 months

            await database.models.subgraphMicroCreditBorrowers.create({
                userId: user.id,
                repaid: idx === 3 ? 0 : 10, // only user 3 did not pay nothing
                lastRepayment: (idx === 1 || idx === 2) ? (twoWeeksAgo.getTime()  / 1000) | 0 : undefined,
                amount: 100,
                period,
                status: 1
            });

            await database.models.microCreditBorrowers.create({
                userId: user.id,
                performance: idx === 1 ? 100 : 80,
                manager: 'abc123'
            }); 
        });
    });

    after(async () => {
        await tests.config.setup.truncate(sequelize, 'appUser');
        await tests.config.setup.truncate(sequelize, 'microCreditApplications');
        await tests.config.setup.truncate(sequelize, 'subgraphMicroCreditBorrowers');
        await tests.config.setup.truncate(sequelize, 'microCreditBorrowers');
        await tests.config.setup.truncate(sequelize, 'appNotification');
        await tests.config.setup.truncate(sequelize);
        restore();
    });

    afterEach(async () => {
        spySendNotification.resetHistory();
    });

    it('should send push notification to borrowers', async () => {
        await notification(null, null);

        assert.callCount(spySendNotification, 5);
        expect(spySendNotification.getCall(0).args[0]).to.have.all.members([users[0].id])
        expect(spySendNotification.getCall(0).args[1]).to.be.eq(MICROCREDIT_WELCOME)

        expect(spySendNotification.getCall(1).args[0]).to.have.all.members([users[1].id])
        expect(spySendNotification.getCall(1).args[1]).to.be.eq(HIGH_PERFORMANCE)

        expect(spySendNotification.getCall(2).args[0]).to.have.all.members([users[2].id])
        expect(spySendNotification.getCall(2).args[1]).to.be.eq(LOW_PERFORMANCE)

        expect(spySendNotification.getCall(3).args[0]).to.have.all.members([users[3].id])
        expect(spySendNotification.getCall(3).args[1]).to.be.eq(LOAN_UNPAID)

        expect(spySendNotification.getCall(4).args[0]).to.have.all.members([users[4].id])
        expect(spySendNotification.getCall(4).args[1]).to.be.eq(REMINDER_LOAN_INTEREST)
    });
});