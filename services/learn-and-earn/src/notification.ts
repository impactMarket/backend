import { database, utils, interfaces } from '@impactmarket/core';
import { fn, col, Op, literal } from 'sequelize';
import admin from 'firebase-admin';

export async function availableCourses() {
    const { learnAndEarnPrismicLevel, learnAndEarnUserLevel, appUser } = database.models;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const newCourses = await learnAndEarnPrismicLevel.findAll({
        attributes: ['language'],
        where: {
            availableAt: {
                [Op.gt]: yesterday
            }
        }
    });

    const languages = newCourses.map(el => el.language);

    if (languages.length === 0) {
        return;
    }

    const users = await learnAndEarnUserLevel.findAll({
        attributes: ['userId'],
        include: [{
            model: appUser,
            as: 'user',
            attributes: [],
            required: true,
            where: {
                language: {
                    [Op.in]: languages
                }
            }
        }]
    });

    await _sendPushNotification(users.map(user => user.userId!), interfaces.app.appNotification.NotificationType.LEARN_AND_EARN_NEW_LEVEL)
    
}

export async function incompleteCourses(): Promise<void> {
    const { learnAndEarnUserLevel, appNotification } = database.models;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const usersToNotify = await learnAndEarnUserLevel. findAll({
        attributes: ['userId'],
        include: [{
            attributes: [],
            model: appNotification,
            as: 'notifications',
            required: false,
            where: {
                type: interfaces.app.appNotification.NotificationType.LEARN_AND_EARN_FINISH_LEVEL,
            },
        }],
        where: {
            status: 'started',
            createdAt: {
                [Op.lt]: oneWeekAgo,
            },
        },
        having: literal(`MAX(notifications."createdAt") IS NULL OR MAX(notifications."createdAt") <= CURRENT_TIMESTAMP - INTERVAL '7 days'`),
        group: ['learnAndEarnUserLevel.userId'],
        raw: true,
    });

    if (usersToNotify.length === 0) {
        return;
    }

    await _sendPushNotification(usersToNotify.map(user => user.userId), interfaces.app.appNotification.NotificationType.LEARN_AND_EARN_FINISH_LEVEL)
}

export const _sendPushNotification = async (usersToNotify: number[], type: number) => {
    if (admin.apps.length === 0) {
        utils.pushNotification.initPushNotificationService();
    }

    const { appUser } = database.models;

    const users = await appUser.findAll({
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
        { path: interfaces.app.appNotification.NotificationParamsPath.LEARN_AND_EARN }
    );
}