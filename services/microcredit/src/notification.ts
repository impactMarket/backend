import { database, interfaces, utils } from '@impactmarket/core';
import { Op } from 'sequelize';

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
