import { Op } from 'sequelize';
import { User } from '../db/models/user';

import database from '../loaders/database';
import { Logger } from '../loaders/logger';
import { generateAccessToken } from '../middlewares';
import { ICommunityInfo, IUserWelcomeAuth, IUserWelcome } from '../types';
import BeneficiaryService from './beneficiary';
import CommunityService from './community';
import ExchangeRatesService from './exchangeRates';
import ManagerService from './managers';

const db = database();
export default class UserService {
    public static async auth(
        address: string,
        language: string,
        pushNotificationToken: string
    ): Promise<IUserWelcomeAuth | undefined> {
        try {
            const token = generateAccessToken(address);
            const user = await db.models.user.findOne({ where: { address } });
            if (user === null) {
                await db.models.user.create({
                    address,
                    avatar: (Math.floor(Math.random() * 8) + 1).toString(),
                    language,
                    pushNotificationToken,
                });
            } else {
                await db.models.user.update(
                    { pushNotificationToken },
                    { where: { address } }
                );
            }
            const welcomeUser = await UserService.welcome(address, user);
            if (welcomeUser === undefined) {
                return undefined;
            }
            return {
                token,
                ...welcomeUser,
            };
        } catch (e) {
            Logger.warn('Error while auth user ', address, e.message);
            return undefined;
        }
    }

    public static async welcome(
        address: string,
        user: User | null = null
    ): Promise<IUserWelcome | undefined> {
        if (user === null) {
            user = await db.models.user.findOne({ where: { address } });
            if (user === null) {
                return undefined;
            }
        }
        const beneficiary = await BeneficiaryService.get(user.address);
        const manager = await ManagerService.get(user.address);
        let community: ICommunityInfo | null = null;
        let isBeneficiary = false;
        let isManager = false;
        if (beneficiary !== null) {
            community = await CommunityService.findByPublicId(
                beneficiary.communityId
            );
            isBeneficiary = true;
        }
        if (manager !== null) {
            community = await CommunityService.findByPublicId(
                manager.communityId
            );
            isManager = true;
        } else {
            const rawCommunity = await CommunityService.findByFirstManager(
                user.address
            );
            if (rawCommunity !== null) {
                community = await CommunityService.findByPublicId(
                    rawCommunity.publicId
                );
                isManager = true;
            }
        }
        return {
            user: user as any,
            exchangeRates: await ExchangeRatesService.get(),
            community: community ? community : undefined,
            isBeneficiary,
            isManager,
        };
    }

    public static async setUsername(
        address: string,
        username: string
    ): Promise<boolean> {
        const updated = await db.models.user.update(
            { username },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setCurrency(
        address: string,
        currency: string
    ): Promise<boolean> {
        const updated = await db.models.user.update(
            { currency },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setPushNotificationsToken(
        address: string,
        pushNotificationToken: string
    ): Promise<boolean> {
        const updated = await db.models.user.update(
            { pushNotificationToken },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setLanguage(
        address: string,
        language: string
    ): Promise<boolean> {
        const updated = await db.models.user.update(
            { language },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async get(address: string): Promise<User | null> {
        return db.models.user.findOne({ where: { address } });
    }

    public static async getAllAddresses(): Promise<string[]> {
        return (await db.models.user.findAll({ attributes: ['address'] })).map(
            (u) => u.address
        );
    }

    public static async getPushTokensFromAddresses(
        addresses: string[]
    ): Promise<string[]> {
        const users = await db.models.user.findAll({
            attributes: ['pushNotificationToken'],
            where: { address: { [Op.in]: addresses } },
        });
        return users.filter((u) => u.pushNotificationToken !== null).map((u) => u.pushNotificationToken!);
    }

    public static async mappedNames(): Promise<Map<string, string>> {
        const mapped = new Map<string, string>();
        const query = await db.models.user.findAll();
        for (let index = 0; index < query.length; index++) {
            const element = query[index];
            mapped.set(element.address, element.username ? element.username : '');
        }
        return mapped;
    }
}
