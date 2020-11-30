import { Op } from 'sequelize';
import { User, UserAttributes, UserModel } from '../db/models/user';

import database from '../loaders/database';
import { Logger } from '../loaders/logger';
import { generateAccessToken } from '../middlewares';
import { ICommunityInfo, IUserWelcomeAuth, IUserWelcome } from '../types';
import BeneficiaryService from './beneficiary';
import CommunityService from './community';
import ExchangeRatesService from './exchangeRates';
import ManagerService from './managers';

const sequelize = database();
export default class UserService {
    public static async auth(
        address: string,
        language: string,
        pushNotificationToken: string
    ): Promise<IUserWelcomeAuth | undefined> {
        try {
            const token = generateAccessToken(address);
            const user = await sequelize.models.User.findOne<UserModel>({ where: { address } });
            if (user === null) {
                await User.create<User>({
                    address,
                    avatar: (Math.floor(Math.random() * 8) + 1).toString(),
                    language,
                    pushNotificationToken,
                });
            } else {
                await User.update(
                    { pushNotificationToken },
                    { where: { address } }
                );
            }
            const welcomeUser = await UserService.welcome(address, user?._attributes);
            if (welcomeUser === undefined) {
                return undefined;
            }
            return {
                token,
                ...welcomeUser,
            };
        } catch (e) {
            Logger.warning('Error while auth user ', address, e.message);
            return undefined;
        }
    }

    public static async welcome(
        address: string,
        user: UserAttributes | null = null
    ): Promise<IUserWelcome | undefined> {
        if (user === null) {
            user = await User.findOne({ where: { address } });
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
        const updated = await User.update(
            { username },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setCurrency(
        address: string,
        currency: string
    ): Promise<boolean> {
        const updated = await User.update(
            { currency },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setPushNotificationsToken(
        address: string,
        pushNotificationToken: string
    ): Promise<boolean> {
        const updated = await User.update(
            { pushNotificationToken },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setLanguage(
        address: string,
        language: string
    ): Promise<boolean> {
        const updated = await User.update(
            { language },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async get(address: string): Promise<User | null> {
        return User.findOne({ where: { address } });
    }

    public static async getAllAddresses(): Promise<string[]> {
        return (await User.findAll({ attributes: ['address'] })).map(
            (u) => u.address
        );
    }

    public static async getPushTokensFromAddresses(
        addresses: string[]
    ): Promise<string[]> {
        const users = await User.findAll({
            attributes: ['pushNotificationToken'],
            where: { address: { [Op.in]: addresses } },
        });
        return users.map((u) => u.pushNotificationToken);
    }

    public static async mappedNames(): Promise<Map<string, string>> {
        const mapped = new Map<string, string>();
        const query = await User.findAll();
        for (let index = 0; index < query.length; index++) {
            const element = query[index];
            mapped.set(element.address, element.username);
        }
        return mapped;
    }
}
