import axios from 'axios';
import config from '../config';
import { client as prismic } from '../utils/prismic';
import { NotificationType } from '../interfaces/app/appNotification';
import { models } from '../database';
import { AppUserModel } from '../database/models/app/appUser';
import localesConfig from '../utils/locale.json';

export async function sendNotification(
    users: AppUserModel[],
    type: NotificationType,
) {
    // registry notification
    await models.appNotification.bulkCreate(users.map(el => ({
        userId: el.id,
        type,
        isWallet: true,
        isWebApp: true,
    })));

    // filter users that have walletPNT or appPNT
    users = users.filter(el => el.walletPNT || el.appPNT);

    // get only unique languages
    const languages = [...new Set(users.map(el => el.language))];

    // get notification from prismic
    const prismicNotifications = {};
    const fetchMessagesFromPrismic = languages.map(async language => {
        const locale = localesConfig.find(({ shortCode }) => language === shortCode.toLowerCase())?.code;
        const defaultLocale = localesConfig.find(({ isDefault }) => isDefault)?.code;

        // get prismic document
        const response = await prismic.getAllByType('pwa-view-notifications', {
            lang: locale || defaultLocale,
        });
        const data = response[0].data;
        const title = data[`message-type${type}Title`][0].text;
        const description = data[`message-type${type}Description`][0].text;

        prismicNotifications[language] = {
            title,
            description,
        };
    });

    await Promise.all(promises);

    // send notification
    const submitPushNotificationsToFCM = users.map(async user => {
        let prismicData = prismicNotifications[user.language];

        if (!prismicData) {
            prismicData = prismicNotifications['en'];
        }

        sendFirebasePushNotification(prismicData.title, prismicData.description, (user.walletPNT || user.appPNT)!);
    });

    await Promise.all(promises2);
}

export async function sendFirebasePushNotification(title: string, body: string, token: string) {
    try {
        const message = {
            notification: {
                title,
                body
            },
            token,
        };

        await axios.post(
            'https://fcm.googleapis.com/fcm/send',
            JSON.stringify(message),
            {
                headers: {
                    Authorization: 'key=' + config.firebaseKey,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Push notification failed');
    }
}