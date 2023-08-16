import { database, interfaces, utils } from '@impactmarket/core';
import { Op, fn, col } from 'sequelize';

export const welcome = async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const microCreditWelcomeType = interfaces.app.appNotification.NotificationType.MICROCREDIT_WELCOME;
    
    const borrowers = await database.models.microCreditApplications.findAll({
        where: {
            status: 0,
            decisionOn: {
                [Op.lt]: oneWeekAgo,
            }
        }
    });

    // get users already notified
    const userIds = borrowers.map(borrower => borrower.userId);

    const notifications = await database.models.appNotification.findAll({
        attributes: ['userId'],
        where: {
            userId: {
                [Op.in]: userIds,
            },
            type: microCreditWelcomeType
        }
    });

    const usersNotified = notifications.map(notification => notification.userId);
    const usersToNotify = userIds.filter(el => !usersNotified.includes(el));

    // send push notification
    const users = await database.models.appUser.findAll({
        attributes: ['walletPNT'],
        where: {
            id: {
                [Op.in]: usersToNotify,
            }
        }
    });

    utils.pushNotification.sendNotification(users, microCreditWelcomeType, true, true);
};

export const increasingInterest = async () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const { REMINDER_LOAN_INTEREST, LOAN_UNPAID } = interfaces.app.appNotification.NotificationType;

    const borrowers = await database.models.microCreditApplications.findAll({
        attributes: ['userId'],
        where: {
            status: 1,
            decisionOn: {
                [Op.lt]: twoWeeksAgo,
            }
        },
    });

    // get users already notified
    const userIds = borrowers.map(borrower => borrower.userId);

    const notifications = await database.models.appNotification.findAll({
        attributes: ['userId'],
        where: {
            userId: {
                [Op.in]: userIds,
            },
            type: {
                [Op.or]: [REMINDER_LOAN_INTEREST, LOAN_UNPAID]
            },
            createdAt: {
                [Op.lt]: twoWeeksAgo,
            }
        }
    });

    const usersNotified = notifications.map(notification => notification.userId);
    const usersToNotify = userIds.filter(el => !usersNotified.includes(el));

    // send push notification
    const users = await database.models.appUser.findAll({
        attributes: ['walletPNT'],
        where: {
            id: {
                [Op.in]: usersToNotify,
            }
        }
    });

    // TODO: notify the amount
    utils.pushNotification.sendNotification(users, REMINDER_LOAN_INTEREST, true, true);
}

export const unpaidLoan = async () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const { LOAN_UNPAID } = interfaces.app.appNotification.NotificationType;

    const applications = await database.models.microCreditApplications.findAll({
        attributes: [
            'userId',
            [fn('datediff', fn("NOW") , col('decisionOn')), 'decisionOn'] // how many days from the decisionOn to today
        ],
        where: {
            status: 1 // claimed
        }
    }) as any;

    const borrowers = await database.models.subgraphMicroCreditBorrowers.findAll({
        where: {
            userId: {
                [Op.in]: applications.map(application => application.userId)
            },
            repaid: 0
        }
    });

    const nonPayingUsers = borrowers.filter(borrower => {
        const application = applications.find(app => app.userId === borrower.userId)!;
        const halfPeriod = (borrower.period / 86400) / 2;

        return application.decisionOn > halfPeriod
    });

    // get users already notified
    const userIds = nonPayingUsers.map(borrower => borrower.userId);

    const notifications = await database.models.appNotification.findAll({
        attributes: ['userId'],
        where: {
            userId: {
                [Op.in]: userIds,
            },
            type: LOAN_UNPAID,
            createdAt: {
                [Op.lt]: twoWeeksAgo,
            }
        }
    });

    const usersNotified = notifications.map(notification => notification.userId);
    const usersToNotify = userIds.filter(el => !usersNotified.includes(el));

    // send push notification
    const users = await database.models.appUser.findAll({
        attributes: ['walletPNT'],
        where: {
            id: {
                [Op.in]: usersToNotify,
            }
        }
    });

    // TODO: notify the amount
    utils.pushNotification.sendNotification(users, LOAN_UNPAID, true, true);
}