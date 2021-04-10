import { AppAnonymousReport } from '@interfaces/app/appAnonymousReport';
import { AppUserDeviceCreation } from '@interfaces/app/appUserDevice';
import { User, UserCreationAttributes } from '@interfaces/app/user';
import { Logger } from '@utils/logger';
import { Op } from 'sequelize';

import { generateAccessToken } from '../../api/middlewares';
import { models, sequelize } from '../../database';
import { ICommunity, IUserHello, IUserAuth } from '../../types/endpoints';
import CommunityService from '../ubi/community';
import ExchangeRatesService from './exchangeRates';

export default class UserService {
    public static sequelize = sequelize;
    public static anonymousReport = models.anonymousReport;
    public static user = models.user;
    public static beneficiary = models.beneficiary;
    public static manager = models.manager;
    public static appUserTrust = models.appUserTrust;
    public static appUserThroughTrust = models.appUserThroughTrust;
    public static userDevice = models.userDevice;

    public static async authenticate(
        address: string,
        language: string,
        currency: string | undefined,
        pushNotificationToken: string,
        phone?: string // until the user updates to new version, this can be undefined
    ): Promise<IUserAuth> {
        try {
            const token = generateAccessToken(address);
            let user = await this.user.findOne({
                where: { address },
                raw: true,
            });
            if (user === null) {
                try {
                    await this.sequelize.transaction(async (t) => {
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
                        user = await this.user.create(createUser, {
                            transaction: t,
                        });
                        if (phone) {
                            const userTrust = await this.appUserTrust.create(
                                {
                                    phone,
                                },
                                { transaction: t }
                            );
                            await this.appUserThroughTrust.create(
                                {
                                    userAddress: address,
                                    appUserTrustId: userTrust.id,
                                },
                                { transaction: t }
                            );
                        }
                    });
                } catch (e) {
                    Logger.error('creating account ' + e);
                }
            } else {
                await this.user.update(
                    { pushNotificationToken },
                    { where: { address } }
                );
            }
            if (user === null) {
                throw new Error('User was not defined!');
            }
            const userHello = await this.loadUser(user.address);
            return {
                token,
                user,
                ...userHello,
            };
        } catch (e) {
            Logger.warn(`Error while auth user ${address} ${e}`);
            throw new Error(e);
        }
    }

    public static async hello(
        address: string,
        phone?: string
    ): Promise<IUserHello> {
        const user = await this.user.findOne({
            include: [
                {
                    model: this.appUserTrust,
                    as: 'throughTrust',
                    include: [
                        {
                            model: this.appUserTrust,
                            as: 'selfTrust',
                        },
                    ],
                },
            ],
            where: { address },
        });
        if (user === null) {
            throw new Error(address + ' user not found!');
        }
        if (phone) {
            const uu = user.toJSON() as User;
            const userTrustId =
                uu.throughTrust && uu.throughTrust.length > 0
                    ? uu.throughTrust[0].id
                    : undefined;
            if (userTrustId === undefined) {
                try {
                    await this.sequelize.transaction(async (t) => {
                        const userTrust = await this.appUserTrust.create(
                            {
                                phone,
                            },
                            { transaction: t }
                        );
                        await this.appUserThroughTrust.create(
                            {
                                userAddress: address,
                                appUserTrustId: userTrust.id,
                            },
                            { transaction: t }
                        );
                    });
                } catch (e) {
                    Logger.error(
                        'creating trust profile to existing account ' + e
                    );
                }
            }
        }
        return await UserService.loadUser(user.address);
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

    public static async setDevice(
        deviceInfo: AppUserDeviceCreation
    ): Promise<boolean> {
        const exists = await this.userDevice.findOne({
            where: {
                userAddress: deviceInfo.userAddress,
                identifier: deviceInfo.identifier,
                network: deviceInfo.network,
                device: deviceInfo.device,
            },
        });
        try {
            if (exists !== null) {
                await this.userDevice.update(
                    { lastLogin: new Date() },
                    {
                        where: {
                            userAddress: deviceInfo.userAddress,
                            identifier: deviceInfo.identifier,
                            network: deviceInfo.network,
                            device: deviceInfo.device,
                        },
                    }
                );
            } else {
                await this.userDevice.create(deviceInfo);
            }
            return true;
        } catch (e) {
            if (e.name === 'SequelizeUniqueConstraintError') {
                await this.userDevice.update(
                    { lastLogin: new Date() },
                    {
                        where: {
                            userAddress: deviceInfo.userAddress,
                            identifier: deviceInfo.identifier,
                            network: deviceInfo.network,
                            device: deviceInfo.device,
                        },
                    }
                );
                return true;
            }
        }
        return false;
    }

    public static async get(address: string): Promise<User | null> {
        return this.user.findOne({ where: { address }, raw: true });
    }

    public static report(
        communityId: string | undefined,
        message: string
    ): Promise<AppAnonymousReport> {
        return this.anonymousReport.create(
            communityId ? { communityId, message } : { message }
        );
    }

    public static async exists(address: string): Promise<boolean> {
        const exists = await this.user.findOne({
            attributes: ['address'],
            where: { address },
            raw: true,
        });
        console.log(exists);
        return exists !== null;
    }

    public static async getAllAddresses(): Promise<string[]> {
        return (
            await this.user.findAll({ attributes: ['address'], raw: true })
        ).map((u) => u.address);
    }

    public static async getPushTokensFromAddresses(
        addresses: string[]
    ): Promise<string[]> {
        const users = await this.user.findAll({
            attributes: ['pushNotificationToken'],
            where: { address: { [Op.in]: addresses } },
            raw: true,
        });
        return users
            .filter((u) => u.pushNotificationToken !== null)
            .map((u) => u.pushNotificationToken!);
    }

    /**
     * TODO: improve
     */
    private static async loadUser(userAddress: string): Promise<IUserHello> {
        const user = await this.user.findOne({
            include: [
                {
                    model: this.beneficiary,
                    as: 'beneficiary',
                    required: false,
                },
                {
                    model: this.manager,
                    as: 'manager',
                    required: false,
                },
                {
                    model: this.appUserTrust,
                    as: 'throughTrust',
                    include: [
                        {
                            model: this.appUserTrust,
                            as: 'selfTrust',
                        },
                    ],
                },
            ],
            where: { address: userAddress },
            // raw: true,
        });
        if (user === null) {
            throw new Error('User is null?');
        }
        const fUser = user.toJSON() as User;
        let community: ICommunity | null = null;
        if (fUser.beneficiary!.length > 0) {
            community = await CommunityService.getByPublicId(
                fUser.beneficiary![0].communityId
            );
        } else if (fUser.manager!.length > 0) {
            community = await CommunityService.getByPublicId(
                fUser.manager![0].communityId
            );
        } else {
            const communityId = await CommunityService.findByFirstManager(
                fUser.address
            );
            if (communityId) {
                community = await CommunityService.getByPublicId(communityId);
            }
        }
        return {
            isBeneficiary: fUser.beneficiary!.length > 0,
            isManager: fUser.manager!.length > 0,
            blocked:
                fUser.beneficiary!.length > 0
                    ? fUser.beneficiary![0].blocked
                    : false,
            verifiedPN:
                fUser?.throughTrust?.length !== 0
                    ? fUser?.throughTrust![0].verifiedPhoneNumber
                    : undefined,
            suspect:
                fUser?.throughTrust?.length !== 0
                    ? fUser?.throughTrust![0].selfTrust
                        ? fUser?.throughTrust![0].selfTrust?.length > 1 ||
                          fUser?.throughTrust![0].suspect
                        : undefined
                    : undefined,
            rates: await ExchangeRatesService.get(),
            community: community ? community : undefined,
        };
    }
}
