import { Op } from 'sequelize';
import { User } from '../db/models/user';

import database from '../loaders/database';
import { Logger } from '../loaders/logger';
import { generateAccessToken } from '../middlewares';
import { ICommunity, IUserHello, IUserAuth } from '../types/endpoints';
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
    ): Promise<IUserAuth> {
        try {
            const token = generateAccessToken(address);
            let user = await db.models.user.findOne({ where: { address } });
            if (user === null) {
                user = await db.models.user.create({
                    address,
                    language,
                    pushNotificationToken,
                });
            } else {
                await db.models.user.update(
                    { pushNotificationToken },
                    { where: { address } }
                );
            }
            const loadedUser = await UserService.loadUser(user);
            return {
                user,
                token,
                ...loadedUser,
            };
        } catch (e) {
            Logger.warn('Error while auth user ', address, e.message);
            throw new Error(e);
        }
    }

    public static async hello(
        address: string
    ): Promise<IUserHello> {
        const user = await db.models.user.findOne({ where: { address } });
        if (user === null) {
            throw new Error(address + ' user not found!');
        }
        return await UserService.loadUser(user);
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

    public static async setGender(
        address: string,
        gender: string
    ): Promise<boolean> {
        const updated = await db.models.user.update(
            { gender },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setAge(
        address: string,
        age: number
    ): Promise<boolean> {
        const updated = await db.models.user.update(
            { age },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setChilds(
        address: string,
        childs: number
    ): Promise<boolean> {
        const updated = await db.models.user.update(
            { childs },
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

    private static async loadUser(user: User): Promise<IUserHello> {
        let community: ICommunity | undefined;
        let communityId: string | undefined;
        let isBeneficiary = false;
        let isManager = false;
        const beneficiary = await BeneficiaryService.get(user.address);
        if (beneficiary) {
            isBeneficiary = true;
            communityId = beneficiary.communityId;
        }
        const manager = await ManagerService.get(user.address);
        if (manager) {
            isManager = true;
            communityId = manager.communityId;
        }
        if (communityId) {
            const _community = await CommunityService.get(communityId);
            if (_community) {
                community = _community;
            }
        } else {
            const _communityId = await CommunityService.findByFirstManager(
                user.address
            );
            if (_communityId !== null) {
                const _community = await CommunityService.get(_communityId);
                if (_community) {
                    isManager = true;
                    community = _community;
                }
            }
        }
        return {
            exchangeRates: await ExchangeRatesService.get(),
            community: community ? community : undefined,
            isBeneficiary,
            isManager,
        };
    }
}
