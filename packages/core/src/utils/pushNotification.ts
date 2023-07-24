import { AppUserModel } from '../database/models/app/appUser';
import { NotificationType } from '../interfaces/app/appNotification';
import { models } from '../database';
import { client as prismic } from '../utils/prismic';
import localesConfig from '../utils/locale.json';
// it needs to be imported this way, or the initialize will fail
import { AppUser } from '../interfaces/app/appUser';
import { Logger } from './logger';
import { Transaction } from 'sequelize';
import { utils } from '../../index';
import admin from 'firebase-admin';
import config from '../config';

export async function sendNotification(
    users: AppUserModel[],
    type: NotificationType,
    isWallet: boolean = true,
    isWebApp: boolean = true,
    params: object | undefined = undefined,
    transaction: Transaction | undefined = undefined
) {
    try {
        // registry notification
        await models.appNotification.bulkCreate(
            users.map(el => ({
                userId: el.id,
                type,
                isWallet,
                isWebApp,
                params
            })),
            { transaction }
        );

        // filter users that have walletPNT
        users = users.filter(el => el.walletPNT);

        if (users.length === 0) {
            return;
        }

        // get only unique languages
        const languages = [...new Set(users.map(el => el.language))];

        // mount notification object with title and description from prismic and users by language
        const prismicNotifications: { [language: string]: { title: string; description: string; users: AppUser[] } } =
            {};

        const fetchNotificationsFromPrismic = async (language: string) => {
            const locale = localesConfig.find(({ shortCode }) => language === shortCode.toLowerCase())?.code;
            const defaultLocale = localesConfig.find(({ isDefault }) => isDefault)?.code;

            // get prismic document
            const response = await prismic.getAllByType('push_notifications_data', {
                lang: locale || defaultLocale
            });
            const { data } = response[0];
            const title = data[`type${type}title`];
            const description = data[`type${type}description`];

            prismicNotifications[language] = {
                title,
                description,
                users: users.filter(el => el.language === language)
            };
        };

        await Promise.all(languages.map(fetchNotificationsFromPrismic));

        // send notification by group of languages
        Object.keys(prismicNotifications).forEach(async key => {
            const prismicData = prismicNotifications[key];
            sendFirebasePushNotification(
                prismicData.users.map(el => el.walletPNT!),
                prismicData.title,
                prismicData.description
            ).catch(error => utils.Logger.error('sendFirebasePushNotification' + error));
        });
    } catch (error) {
        Logger.error('Failed to add notification:', error);
    }
}

export async function sendFirebasePushNotification(
    tokens: string[],
    title: string,
    body: string,
    data: any = undefined
) {
    try {
        const batch = 500;
        for (let i = 0; ; i += batch) {
            const tokens_batch = tokens.slice(i, i + batch);
            const message = {
                data,
                notification: {
                    body,
                    title
                },
                tokens: tokens_batch
            };

            admin
                .messaging()
                .sendEachForMulticast(message, process.env.NODE_ENV === 'developement')
                .then(Logger.info)
                .catch(Logger.error);

            if (i + batch > tokens.length) {
                break;
            }
        }
    } catch (error) {
        Logger.error('Push notification failed', error);
    }
}

export function initPushNotificationService() {
    try {
        // recover config file
        const base64file = config.firebaseFileBase64;
        const jsonConfig = JSON.parse(Buffer.from(base64file, 'base64').toString());

        admin.initializeApp({
            credential: admin.credential.cert(jsonConfig)
        });

        Logger.info('🔔 Push notification service initialized');
    } catch (error) {
        Logger.error('Push notification service failed to initialize', error);
    }
}
