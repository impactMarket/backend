import { Sequelize } from 'sequelize';
import { SinonSpy, restore, spy, assert } from 'sinon';
import { expect } from 'chai';

import { interfaces, database, tests } from '@impactmarket/core';
import { notification } from '../handler';
import * as sendNotification from '../src/notification';

describe('notification lambda', () => {
    let sequelize: Sequelize;
    let spySendNotification: SinonSpy;

    const { MICROCREDIT_WELCOME, LOAN_UNPAID, HIGH_PERFORMANCE, LOW_PERFORMANCE, REMINDER_LOAN_INTEREST } = interfaces.app.appNotification.NotificationType;


    before(async () => {
        sequelize = tests.config.setup.sequelizeSetup();
        await sequelize.sync();
        spySendNotification = spy(sendNotification, '_sendPushNotification');
    });

    after(async () => {
        await tests.config.setup.truncate(sequelize);
        restore();
    });

    afterEach(async () => {
        spySendNotification.resetHistory();
    });

    describe('cenario 1: welcome notification', () => {
        let users: interfaces.app.appUser.AppUser[];

        before(async () => {
            users = await tests.factories.UserFactory({ n: 5 });
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            await database.models.microCreditApplications.bulkCreate(users.map((user, idx) => ({
                userId: user.id,
                decisionOn: idx < 2 ? oneWeekAgo : new Date(), // users 0 and 1 match to receive the notification
                status: 1
            })));
        });

        after(async () => {
            await tests.config.setup.truncate(sequelize, 'appUser');
            await tests.config.setup.truncate(sequelize, 'microCreditApplications');
            await tests.config.setup.truncate(sequelize, 'appNotification');
        });

        it('should notify only the new borrowers', async () => {
            await notification(null, null);

            assert.callCount(spySendNotification, 1);
            expect(spySendNotification.getCall(0).args[0]).to.have.all.members([users[0].id, users[1].id])
            expect(spySendNotification.getCall(0).args[1]).to.be.eq(MICROCREDIT_WELCOME)
        });

        it('should not send the notification again', async () => {
            await notification(null, null);
            assert.callCount(spySendNotification, 0);
        });
    });

    describe('cenario 2: unpaid loan', () => {
        let users: interfaces.app.appUser.AppUser[];

        before(async () => {
            users = await tests.factories.UserFactory({ n: 5 });
            const twoMonthsAgo = new Date();
            twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

            await database.models.microCreditApplications.bulkCreate(users.map((user, idx) => ({
                userId: user.id,
                decisionOn: idx < 2 ? twoMonthsAgo : new Date(),
                status: idx < 2 ? 1 : 2
            })));

            const period = 86400 * 30 * 4 // period of 4 months

            await database.models.subgraphMicroCreditBorrowers.bulkCreate(users.map((user, idx) => ({
                userId: user.id,
                repaid: idx < 2 ? 0 : 10,
                amount: 100,
                period,
                status: idx < 2 ? 1 : 0
            })));

            // users already received the welcome notification
            await database.models.appNotification.bulkCreate(users.map(user => ({
                userId: user.id,
                type: MICROCREDIT_WELCOME
            })));
        });

        after(async () => {
            await tests.config.setup.truncate(sequelize, 'appUser');
            await tests.config.setup.truncate(sequelize, 'microCreditApplications');
            await tests.config.setup.truncate(sequelize, 'subgraphMicroCreditBorrowers');
            await tests.config.setup.truncate(sequelize, 'appNotification');
        });

        it('should notify only the borrower that did not repay yet', async () => {
            await notification(null, null);

            assert.callCount(spySendNotification, 1);
            expect(spySendNotification.getCall(0).args[0]).to.have.all.members([users[0].id, users[1].id])
            expect(spySendNotification.getCall(0).args[1]).to.be.eq(LOAN_UNPAID)
        });
    });

    describe('cenario 3: high performance', () => {
        let users: interfaces.app.appUser.AppUser[];

        before(async () => {
            users = await tests.factories.UserFactory({ n: 5 });
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);

            await database.models.microCreditApplications.bulkCreate(users.map((user, idx) => ({
                userId: user.id,
                decisionOn: idx < 2 ? lastMonth : new Date(),
                status: idx < 2 ? 1 : 0
            })));

            await database.models.microCreditBorrowers.bulkCreate(users.map((user, idx) => ({
                userId: user.id,
                performance: idx < 2 ? 100 : 0,
                manager: 'abc123'
            })));

            await database.models.subgraphMicroCreditBorrowers.bulkCreate(users.map((user, idx) => ({
                userId: user.id,
                repaid: idx < 2 ? 10 : 0,
                lastRepayment: idx < 2 ? (twoWeeksAgo.getTime()  / 1000) | 0 : undefined,
                amount: 100,
                period: 86400 * 30 * 4, // 4 months
                status: idx < 2 ? 1 : 0
            })));

            // users already received the welcome notification
            await database.models.appNotification.bulkCreate(users.map(user => ({
                userId: user.id,
                type: MICROCREDIT_WELCOME
            })));
        });

        after(async () => {
            await tests.config.setup.truncate(sequelize, 'appUser');
            await tests.config.setup.truncate(sequelize, 'microCreditApplications');
            await tests.config.setup.truncate(sequelize, 'subgraphMicroCreditBorrowers');
            await tests.config.setup.truncate(sequelize, 'microCreditBorrowers');
            await tests.config.setup.truncate(sequelize, 'appNotification');
        });

        it('should notify only the borrower that repaid something and have a high performance', async () => {
            // if the borrower already received the "high" performance notification in the last two weeks, do not send again
            await notification(null, null);

            assert.callCount(spySendNotification, 1);
            expect(spySendNotification.getCall(0).args[0]).to.have.all.members([users[0].id, users[1].id])
            expect(spySendNotification.getCall(0).args[1]).to.be.eq(HIGH_PERFORMANCE)
        });
    });

    describe('cenario 4: low performance', () => {
        let users: interfaces.app.appUser.AppUser[];

        before(async () => {
            users = await tests.factories.UserFactory({ n: 5 });
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);

            await database.models.microCreditApplications.bulkCreate(users.map((user, idx) => ({
                userId: user.id,
                decisionOn: idx < 2 ? lastMonth : new Date(),
                status: idx < 2 ? 1 : 0
            })));

            await database.models.microCreditBorrowers.bulkCreate(users.map((user, idx) => ({
                userId: user.id,
                performance: idx < 2 ? 80 : 0,
                manager: 'abc123'
            })));

            await database.models.subgraphMicroCreditBorrowers.bulkCreate(users.map((user, idx) => ({
                userId: user.id,
                repaid: idx < 2 ? 10 : 0,
                lastRepayment: idx < 2 ? (twoWeeksAgo.getTime()  / 1000) | 0 : undefined,
                amount: 100,
                period: 86400 * 30 * 4, // 4 months
                status: idx < 2 ? 1 : 0
            })));

            // users already received the welcome notification
            await database.models.appNotification.bulkCreate(users.map(user => ({
                userId: user.id,
                type: MICROCREDIT_WELCOME
            })));
            // user 0 also received a high notification before, so, they cannot receive another
            await database.models.appNotification.create({
                userId: users[0].id,
                type: HIGH_PERFORMANCE
            });
        });

        after(async () => {
            await tests.config.setup.truncate(sequelize, 'appUser');
            await tests.config.setup.truncate(sequelize, 'microCreditApplications');
            await tests.config.setup.truncate(sequelize, 'subgraphMicroCreditBorrowers');
            await tests.config.setup.truncate(sequelize, 'microCreditBorrowers');
            await tests.config.setup.truncate(sequelize, 'appNotification');
        });

        it('should notify only the borrower that repaid something and have a low performance', async () => {
            // if the borrower already received the "high" or "low" performance notification in the last two weeks, do not send again
            await notification(null, null);

            assert.callCount(spySendNotification, 1);
            expect(spySendNotification.getCall(0).args[0]).to.have.all.members([users[1].id])
            expect(spySendNotification.getCall(0).args[1]).to.be.eq(LOW_PERFORMANCE)
        });
    });

    describe('cenario 5: increasing interest', () => {
        let users: interfaces.app.appUser.AppUser[];

        before(async () => {
            users = await tests.factories.UserFactory({ n: 5 });
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

            await database.models.microCreditApplications.bulkCreate(users.map((user, idx) => ({
                userId: user.id,
                decisionOn: idx < 4 ? twoWeeksAgo : new Date(),
                status: 1
            })));

            // users already received the welcome notification
            await database.models.appNotification.bulkCreate(users.map(user => ({
                userId: user.id,
                type: MICROCREDIT_WELCOME
            })));
            // users 0, 1 and 2 also received notifications before, so, they cannot receive another
            await Promise.all([
                database.models.appNotification.create({
                    userId: users[0].id,
                    type: HIGH_PERFORMANCE
                }),
                database.models.appNotification.create({
                    userId: users[1].id,
                    type: LOAN_UNPAID
                }),
                database.models.appNotification.create({
                    userId: users[2].id,
                    type: LOW_PERFORMANCE
                })
            ]);
        });

        after(async () => {
            await tests.config.setup.truncate(sequelize, 'appUser');
            await tests.config.setup.truncate(sequelize, 'microCreditApplications');
            await tests.config.setup.truncate(sequelize, 'appNotification');
        });

        it('should notify borrowers about the increasing interest', async () => {
            // this notification should be sent to borrowers that did not receive any of the previous notification type in the last 2 weeks
            await notification(null, null);

            assert.callCount(spySendNotification, 1);
            expect(spySendNotification.getCall(0).args[0]).to.have.all.members([users[3].id])
            expect(spySendNotification.getCall(0).args[1]).to.be.eq(REMINDER_LOAN_INTEREST)
        });
    });

    
});