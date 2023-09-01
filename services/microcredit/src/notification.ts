import { database, interfaces, utils } from '@impactmarket/core';
import { Op, fn, col, WhereOptions, where } from 'sequelize';
import admin from 'firebase-admin';

export const welcome = async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { MICROCREDIT_WELCOME } = interfaces.app.appNotification.NotificationType;
    
    const borrowers = await database.models.microCreditApplications.findAll({
        where: {
            [Op.and]: [
                where(fn('date', col('decisionOn')), '=', oneWeekAgo),
                { status: interfaces.microcredit.microCreditApplications.MicroCreditApplicationStatus.APPROVED }
            ]
        }
    });

    // filter users to notify
    const usersToNotify = await _getUsersToNotify(borrowers, MICROCREDIT_WELCOME);

    if (!!usersToNotify && usersToNotify.length > 0) {
        await _sendPushNotification(usersToNotify, MICROCREDIT_WELCOME);
    }
};

export const increasingInterest = async () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const { REMINDER_LOAN_INTEREST, LOAN_UNPAID, HIGH_PERFORMANCE, LOW_PERFORMANCE } = interfaces.app.appNotification.NotificationType;

    const borrowers = await database.models.microCreditApplications.findAll({
        attributes: ['userId'],
        where: {
            decisionOn: {
                [Op.lt]: twoWeeksAgo,
            },
            status: interfaces.microcredit.microCreditApplications.MicroCreditApplicationStatus.APPROVED
        },
    });

    // filter users to notify
    const usersToNotify = await _getUsersToNotify(borrowers, [REMINDER_LOAN_INTEREST, LOAN_UNPAID, HIGH_PERFORMANCE, LOW_PERFORMANCE], twoWeeksAgo);

    if (!!usersToNotify && usersToNotify.length > 0) {
        await _sendPushNotification(usersToNotify, REMINDER_LOAN_INTEREST);
    }
}

export const unpaidLoan = async () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const { LOAN_UNPAID } = interfaces.app.appNotification.NotificationType;

    const applications = await database.models.microCreditApplications.findAll({
        attributes: [
            'userId',
            'decisionOn'
        ],
        where: {
            status: interfaces.microcredit.microCreditApplications.MicroCreditApplicationStatus.APPROVED,
        }
    });

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

        const today = new Date();
        const decisionOn = new Date(application.decisionOn);
        const diffTime = Math.abs(decisionOn.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        return diffDays >= halfPeriod
    });

    // filter users to notify
    const usersToNotify = await _getUsersToNotify(nonPayingUsers, LOAN_UNPAID, twoWeeksAgo);

    if (!!usersToNotify && usersToNotify.length > 0) {
        await _sendPushNotification(usersToNotify, LOAN_UNPAID);
    }
}

export const lowPerformance = async () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const { LOW_PERFORMANCE, HIGH_PERFORMANCE } = interfaces.app.appNotification.NotificationType;

    // get borrowers with performance bellow 100
    const borrowersPerformance = await database.models.microCreditBorrowers.findAll({
        attributes: ['userId'],
        where: {
            performance: {
                [Op.lt]: 100
            }
        }
    });

    // get users that rapaid something
    const borrowers = await database.models.subgraphMicroCreditBorrowers.findAll({
        where: {
            userId: {
                [Op.in]: borrowersPerformance.map(el => el.userId)
            },
            status: 1,
            lastRepayment: {
                [Op.gt]: (lastMonth.getTime() / 1000) | 0
            }
        }
    });

    // filter users to notify
    const usersToNotify = await _getUsersToNotify(borrowers, [LOW_PERFORMANCE, HIGH_PERFORMANCE], twoWeeksAgo);

    if (!!usersToNotify && usersToNotify.length > 0) {
        await _sendPushNotification(usersToNotify, LOW_PERFORMANCE);
    }
}

export const highPerformance = async () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const { HIGH_PERFORMANCE } = interfaces.app.appNotification.NotificationType;

    // get borrowers with performance bellow 100
    const borrowersPerformance = await database.models.microCreditBorrowers.findAll({
        attributes: ['userId'],
        where: {
            performance: 100
        }
    });

    // get users that rapaid something in the last month
    const borrowers = await database.models.subgraphMicroCreditBorrowers.findAll({
        attributes: ['userId'],
        where: {
            userId: {
                [Op.in]: borrowersPerformance.map(el => el.userId)
            },
            status: 1,
            lastRepayment: {
                [Op.gt]: (lastMonth.getTime() / 1000) | 0
            }
        }
    });

    // filter users to notify
    const usersToNotify = await _getUsersToNotify(borrowers, HIGH_PERFORMANCE, twoWeeksAgo);

    if (!!usersToNotify && usersToNotify.length > 0) {
        await _sendPushNotification(usersToNotify, HIGH_PERFORMANCE);
    }
}

const _getUsersToNotify = async (
    borrowers: {
        userId: number
    }[],
    notificationType: number | number[],
    createdAt?: Date
) => {
    const userIds = borrowers.map(borrower => borrower.userId);

    const where: WhereOptions = {
        userId: {
            [Op.in]: userIds,
        }
    };

    if (createdAt) {
        where.createdAt = {
            [Op.gt]: createdAt,
        }
    };

    if (notificationType instanceof Array) {
        where.type = {
            [Op.or]: notificationType
        }
    } else {
        where.type = notificationType
    };

    const notifications = await database.models.appNotification.findAll({
        attributes: ['userId'],
        where,
    });

    const usersNotified = notifications.map(notification => notification.userId);
    return userIds.filter(el => !usersNotified.includes(el));
}

export const _sendPushNotification = async (usersToNotify: number[], type: number) => {
    if (admin.apps.length === 0) {
        utils.pushNotification.initPushNotificationService();
    }

    const users = await database.models.appUser.findAll({
        attributes: ['id', 'walletPNT', 'language'],
        where: {
            id: {
                [Op.in]: usersToNotify,
            }
        }
    });

    utils.pushNotification.sendNotification(
        users,
        type,
        true,
        true,
        { path: interfaces.app.appNotification.NotificationParamsPath.LOAN_APPROVED }
    );
}