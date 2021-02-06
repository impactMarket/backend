import { User } from '@interfaces/user';
import { UserCreationAttributes } from '@models/user';
import { Logger } from '@utils/logger';
import { Op } from 'sequelize';

import { generateAccessToken } from '../api/middlewares';
import { models } from '../database';
import { ICommunity, IUserHello, IUserAuth } from '../types/endpoints';
import BeneficiaryService from './beneficiary';
import CommunityService from './community';
import ExchangeRatesService from './exchangeRates';
import ManagerService from './managers';

export default class UserService {
    public static user = models.user;

    public static async authenticate(
        address: string,
        language: string,
        currency: string,
        pushNotificationToken: string
    ): Promise<IUserAuth> {
        try {
            const token = generateAccessToken(address);
            let user = await this.user.findOne({ where: { address } });
            if (user === null) {
                let createUser: UserCreationAttributes = {
                    address,
                    language,
                    pushNotificationToken,
                };
                if (currency) {
                    createUser = {
                        ...createUser,
                        currency,
                    };
                }
                user = await this.user.create(createUser);
            } else {
                await this.user.update(
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
            Logger.warn('Error while auth user ', address, e);
            throw new Error(e);
        }
    }

    public static async hello(address: string): Promise<IUserHello> {
        const user = await this.user.findOne({ where: { address } });
        if (user === null) {
            throw new Error(address + ' user not found!');
        }
        return await UserService.loadUser(user);
    }

    public static async setUsername(
        address: string,
        username: string
    ): Promise<boolean> {
        const updated = await this.user.update(
            { username },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setCurrency(
        address: string,
        currency: string
    ): Promise<boolean> {
        const updated = await this.user.update(
            { currency },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setPushNotificationsToken(
        address: string,
        pushNotificationToken: string
    ): Promise<boolean> {
        const updated = await this.user.update(
            { pushNotificationToken },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setLanguage(
        address: string,
        language: string
    ): Promise<boolean> {
        const updated = await this.user.update(
            { language },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setGender(
        address: string,
        gender: string
    ): Promise<boolean> {
        const updated = await this.user.update(
            { gender },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setYear(
        address: string,
        year: number | null
    ): Promise<boolean> {
        const updated = await this.user.update(
            { year },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setChildren(
        address: string,
        children: number | null
    ): Promise<boolean> {
        const updated = await this.user.update(
            { children },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async get(address: string): Promise<User | null> {
        return this.user.findOne({ where: { address } });
    }

    public static async exists(address: string): Promise<boolean> {
        const exists = await this.user.findOne({
            attributes: ['address'],
            where: { address },
        });
        console.log(exists);
        return exists !== null;
    }

    public static async getAllAddresses(): Promise<string[]> {
        return (await this.user.findAll({ attributes: ['address'] })).map(
            (u) => u.address
        );
    }

    public static async getPushTokensFromAddresses(
        addresses: string[]
    ): Promise<string[]> {
        const users = await this.user.findAll({
            attributes: ['pushNotificationToken'],
            where: { address: { [Op.in]: addresses } },
        });
        return users
            .filter((u) => u.pushNotificationToken !== null)
            .map((u) => u.pushNotificationToken!);
    }

    public static async mappedNames(): Promise<Map<string, string>> {
        const mapped = new Map<string, string>();
        const query = await this.user.findAll();
        for (let index = 0; index < query.length; index++) {
            const element = query[index];
            mapped.set(
                element.address,
                element.username ? element.username : ''
            );
        }
        return mapped;
    }

    /**
     * TODO: improve
     */
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
            const _community = await CommunityService.getByPublicId(
                communityId
            );
            if (_community) {
                community = _community;
            }
        } else {
            const _communityId = await CommunityService.findByFirstManager(
                user.address
            );
            if (_communityId !== null) {
                const _community = await CommunityService.getByPublicId(
                    _communityId
                );
                if (_community) {
                    isManager = true;
                    community = _community;
                }
            }
        }
        const { exchangeRates, rates } = await ExchangeRatesService.get();
        return {
            exchangeRates,
            rates,
            community: community ? community : undefined,
            isBeneficiary,
            isManager,
        };
    }
}
