// when release-task.sh runs, it will replace the config file
import serviceAccount from '../utils/firebase-adminsdk.json';

import { client as prismic } from '../utils/prismic';
import { NotificationType } from '../interfaces/app/appNotification';
import { models } from '../database';
import { AppUserModel } from '../database/models/app/appUser';
import localesConfig from '../utils/locale.json';
import admin from 'firebase-admin';
import { AppUser } from '../interfaces/app/appUser';

export async function sendNotification(
    users: AppUserModel[],
    type: NotificationType,
    isWallet: boolean = true,
    isWebApp: boolean = true,
) {
    // registry notification
    await models.appNotification.bulkCreate(users.map(el => ({
        userId: el.id,
        type,
        isWallet,
        isWebApp,
    })));

    // filter users that have walletPNT
    users = users.filter(el => el.walletPNT);

    if (users.length === 0) {
        return;
    }

    // get only unique languages
    const languages = [...new Set(users.map(el => el.language))];

    // mount notification object with title and description from prismic and users by language
    const prismicNotifications: { [language:string]: { title: string, description: string, users: AppUser[] } } = {};
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
            users: users.filter(el => el.language === language),
        };
    });

    await Promise.all(fetchMessagesFromPrismic);

    // send notification by group of languages
    Object.keys(prismicNotifications).forEach(async key => {
        let prismicData = prismicNotifications[key];
        sendFirebasePushNotification(prismicData.users.map(el => el.walletPNT!), prismicData.title, prismicData.description);
    });
}

export async function sendFirebasePushNotification(tokens: string[], title: string, body: string, data: any = undefined) {
    try {
        const batch = 500;
        for (let i = 0; ; i += batch) {
            const tokens_batch = tokens.slice(i, i + batch);
            const message = {
                data,
                notification: {
                    body,
                    title,
                },
                tokens: tokens_batch,
            };
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount as any)
            });
            
            admin
                .messaging()
                .sendMulticast(message)
                .then(response => {
                    console.log('Successfully sent message:', response);
                })
                .catch(error => {
                    console.error('Error sending message:', error);
                });

            if (i + batch > tokens.length) {
                break;
            }
        }
    } catch (error) {
        console.error('Push notification failed');
    }
}