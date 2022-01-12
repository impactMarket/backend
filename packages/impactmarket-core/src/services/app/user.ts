import { Client } from '@hubspot/api-client';
import {
    AppAnonymousReport,
    AppAnonymousReportCreation,
} from '../../interfaces/app/appAnonymousReport';
import { AppNotification } from '../../interfaces/app/appNotification';
import {
    AppUser,
    AppUserCreationAttributes,
} from '../../interfaces/app/appUser';
import { CommunityAttributes } from '../../interfaces/ubi/community';
import { ProfileContentStorage } from '../storage';
import { BaseError } from '../../utils/baseError';
import { Logger } from '../../utils/logger';
import { generateAccessToken } from '../../utils/jwt';
import { Op, QueryTypes } from 'sequelize';

import config from '../../config';
import { models, sequelize } from '../../database';
import { IUserHello, IUserAuth, IBeneficiary, IManager } from '../endpoints';
import CommunityService from '../ubi/community';
import ExchangeRatesService from './exchangeRates';
export default class UserService {
    public static sequelize = sequelize;
    public static appUser = models.appUser;
    public static beneficiary = models.beneficiary;
    public static manager = models.manager;
    public static appUserTrust = models.appUserTrust;
    public static appUserThroughTrust = models.appUserThroughTrust;
    public static appMediaContent = models.appMediaContent;
    public static appMediaThumbnail = models.appMediaThumbnail;
    public static appNotification = models.appNotification;

    private static profileContentStorage = new ProfileContentStorage();

    public static hubspotClient = new Client({ apiKey: config.hubspotKey });

    public static async authenticate(
        user: AppUserCreationAttributes,
        overwrite: boolean = false,
        recover: boolean = false
    ): Promise<IUserAuth> {
        try {
            // generate access token for future interactions that require authentication
            const exists = await this.exists(user.address);

            if (overwrite) {
                await this.overwriteUser(user);
            } else if (!exists) {
                const existsPhone = user.trust?.phone
                    ? await this.existsAccountByPhone(user.trust.phone)
                    : false;

                if (existsPhone)
                    throw new BaseError(
                        'PHONE_CONFLICT',
                        'phone associated with another account'
                    );
            }

            if (recover) {
                await this.recoverAccount(user.address);
            }

            let userFromRegistry: AppUser;
            if (!exists) {
                // create new user, including their phone number information
                userFromRegistry = (
                    await this.appUser.create(user, {
                        include: [
                            {
                                model: this.appUserTrust,
                                as: 'trust',
                            },
                        ],
                    })
                ).toJSON() as AppUser;
            } else {
                if (user.pushNotificationToken) {
                    this.appUser.update(
                        { pushNotificationToken: user.pushNotificationToken },
                        { where: { address: user.address } }
                    );
                }
                // it's not null at this point
                userFromRegistry = (await this.appUser.findOne({
                    include: [
                        {
                            model: this.appMediaContent,
                            as: 'avatar',
                            required: false,
                            include: [
                                {
                                    model: this.appMediaThumbnail,
                                    as: 'thumbnails',
                                    separate: true,
                                },
                            ],
                        },
                        {
                            model: this.appUserTrust,
                            as: 'trust',
                        },
                    ],
                    where: { address: user.address },
                }))!.toJSON() as AppUser;
            }

            if (!userFromRegistry.active) {
                throw new BaseError('INACTIVE_USER', 'user is inactive');
            }

            if (userFromRegistry.deletedAt) {
                throw new BaseError(
                    'DELETION_PROCESS',
                    'account in deletion process'
                );
            }

            const userHello = await this.loadUser(userFromRegistry);
            this.updateLastLogin(userFromRegistry.id);
            const token = generateAccessToken(
                user.address,
                userFromRegistry.id
            );

            return {
                ...userHello,
                token,
                user: userFromRegistry,
            };
        } catch (e) {
            Logger.warn(`Error while auth user ${user.address} ${e}`);
            throw e;
        }
    }

    public static async recoverAccount(address: string) {
        try {
            await this.appUser.update(
                {
                    deletedAt: null,
                },
                {
                    where: { address },
                }
            );
        } catch (error) {
            throw new BaseError('UNEXPECTED_ERROR', error.message);
        }
    }

    public static async overwriteUser(user: AppUserCreationAttributes) {
        try {
            const usersToInactive = await this.appUser.findAll({
                include: [
                    {
                        model: this.appUserTrust,
                        as: 'trust',
                        where: {
                            phone: user.trust?.phone,
                        },
                    },
                ],
                where: {
                    address: {
                        [Op.not]: user.address,
                    },
                },
            });

            const promises = usersToInactive.map((el) =>
                this.appUser.update(
                    {
                        active: false,
                    },
                    {
                        where: {
                            address: el.address,
                        },
                    }
                )
            );

            promises.push(
                this.appUser.update(
                    {
                        active: true,
                    },
                    {
                        where: {
                            address: user.address,
                        },
                    }
                )
            );

            await Promise.all(promises);
        } catch (error) {
            throw new BaseError('UNEXPECTED_ERROR', error.message);
        }
    }

    public static async welcome(
        address: string,
        pushNotificationToken?: string
    ): Promise<IUserHello> {
        let user: AppUser;
        const found = await this.appUser.findOne({
            where: { address },
        });
        if (found === null) {
            throw new BaseError('USER_NOT_FOUND', 'user not found');
        }
        user = found.toJSON() as AppUser;
        if (pushNotificationToken) {
            const updated = await this.appUser.update(
                { pushNotificationToken },
                { where: { address }, returning: true }
            );
            if (updated.length > 0) {
                user = updated[1][0].toJSON() as AppUser;
            }
        }
        return UserService.loadUser(user);
    }

    /**
     * @deprecated
     */
    public static async hello(
        address: string,
        phone?: string
    ): Promise<IUserHello> {
        const user = await this.appUser.findOne({
            include: [
                {
                    model: this.appUserTrust,
                    as: 'trust',
                },
            ],
            where: { address },
        });
        if (user === null) {
            throw new BaseError('USER_NOT_FOUND', address + ' user not found!');
        }
        if (phone) {
            const uu = user.toJSON() as AppUser;
            const userTrustId =
                uu.trust && uu.trust.length > 0 ? uu.trust[0].id : undefined;
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
        return UserService.loadUser(user);
    }

    public static async getPresignedUrlMedia(mime: string): Promise<{
        uploadURL: string;
        filename: string;
    }> {
        return this.profileContentStorage.getPresignedUrlPutObject(mime);
    }

    public static async updateAvatar(
        address: string,
        mediaId: number
    ): Promise<boolean> {
        const updated = await this.appUser.update(
            { avatarMediaId: mediaId },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setUsername(
        address: string,
        username: string
    ): Promise<boolean> {
        const updated = await this.appUser.update(
            { username },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setCurrency(
        address: string,
        currency: string
    ): Promise<boolean> {
        const updated = await this.appUser.update(
            { currency },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setPushNotificationsToken(
        address: string,
        pushNotificationToken: string
    ): Promise<boolean> {
        const updated = await this.appUser.update(
            { pushNotificationToken },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setLanguage(
        address: string,
        language: string
    ): Promise<boolean> {
        const updated = await this.appUser.update(
            { language },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setGender(
        address: string,
        gender: string
    ): Promise<boolean> {
        const updated = await this.appUser.update(
            { gender },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setYear(
        address: string,
        year: number | null
    ): Promise<boolean> {
        const updated = await this.appUser.update(
            { year },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setChildren(
        address: string,
        children: number | null
    ): Promise<boolean> {
        const updated = await this.appUser.update(
            { children },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async get(address: string): Promise<AppUser | null> {
        return this.appUser.findOne({ where: { address }, raw: true });
    }

    public static async report(
        message: string,
        communityId: number | string, // TODO: in-migration-process
        category?: 'general' | 'potential-fraud'
    ): Promise<AppAnonymousReport> {
        let nCommunityId = 0;
        if (typeof communityId === 'string') {
            const r = await models.community.findOne({
                attributes: ['id'],
                where: {
                    publicId: communityId,
                },
            });
            nCommunityId = r!.id;
        } else {
            nCommunityId = communityId;
        }
        let newReport: AppAnonymousReportCreation = {
            message,
            communityId: nCommunityId,
        };
        if (category) {
            newReport = {
                ...newReport,
                category,
            };
        }
        return models.anonymousReport.create(newReport);
    }

    public static async exists(address: string): Promise<boolean> {
        const exists = await this.appUser.findOne({
            attributes: ['address'],
            where: { address },
            raw: true,
        });
        return exists !== null;
    }

    public static async existsAccountByPhone(phone: string): Promise<boolean> {
        const query = `
            SELECT phone, address
            FROM app_user_trust
            LEFT JOIN app_user_through_trust ON "appUserTrustId" = id
            LEFT JOIN "app_user" as "user" ON "user".address = "userAddress"
            WHERE phone = :phone
            AND "user".active = TRUE`;

        const exists = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: {
                phone,
            },
        });

        return exists.length > 0;
    }

    public static async updateLastLogin(id: number): Promise<void> {
        const t = await this.sequelize.transaction();
        try {
            await this.appUser.update(
                {
                    lastLogin: new Date(),
                },
                {
                    where: { id },
                    transaction: t,
                }
            );

            await t.commit();
        } catch (error) {
            await t.rollback();
            Logger.warn(`Error to update last login: ${error}`);
        }
    }

    public static async getAllAddresses(): Promise<string[]> {
        return (
            await this.appUser.findAll({ attributes: ['address'], raw: true })
        ).map((u) => u.address);
    }

    public static async getPushTokensFromAddresses(
        addresses: string[]
    ): Promise<string[]> {
        const users = await this.appUser.findAll({
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
    private static async loadUser(user: AppUser): Promise<IUserHello> {
        // const user = await this.appUser.findOne({
        //     include: [
        //         {
        //             model: this.appUserTrust,
        //             as: 'trust',
        //         },
        //     ],
        //     where: { address: userAddress },
        // });
        // if (user === null) {
        //     throw new Error('User is null?');
        // }
        // const fUser = user.toJSON() as User;
        const beneficiary: IBeneficiary | null = await this.beneficiary.findOne(
            {
                attributes: ['blocked', 'readRules', 'communityId'],
                where: { active: true, address: user.address },
            }
        );
        let manager: IManager | null = await this.manager.findOne({
            attributes: ['readRules', 'communityId'],
            where: { active: true, address: user.address },
        });

        // get user community
        // TODO: deprecated in mobile-app@1.1.5
        let community: CommunityAttributes | null = null;
        let managerInPendingCommunity = false;
        // reusable method
        const getCommunity = async (communityId: number) =>
            CommunityService.findById(communityId);

        if (beneficiary) {
            community = await getCommunity(beneficiary.communityId);
        } else if (manager) {
            community = await getCommunity(manager.communityId);
        } else {
            const communityId = await CommunityService.findByFirstManager(
                user.address
            );
            if (communityId) {
                community = await getCommunity(communityId);
                managerInPendingCommunity = true;
                manager = {
                    communityId,
                    readRules: false,
                };
            }
        }
        // until here

        return {
            isBeneficiary: beneficiary !== null, // TODO: deprecated
            isManager: manager !== null || managerInPendingCommunity, // TODO: deprecated
            blocked: beneficiary !== null ? beneficiary.blocked : false, // TODO: deprecated
            verifiedPN:
                user.trust && user.trust.length !== 0
                    ? user.trust[0].verifiedPhoneNumber
                    : undefined, // TODO: deprecated in mobile-app@1.1.5
            suspect: user.suspect, // TODO: deprecated
            rates: await ExchangeRatesService.get(), // TODO: deprecated in mobile-app@1.1.5
            community: community ? community : undefined, // TODO: deprecated in mobile-app@1.1.5
            communityId: community ? community.id : undefined, // TODO: deprecated
            user: {
                suspect: user.suspect,
            },
            manager,
            beneficiary,
        };
    }

    public static async edit(user: AppUser): Promise<AppUser> {
        const updated = await this.appUser.update(user, {
            returning: true,
            where: { address: user.address },
        });
        if (updated[0] === 0) {
            throw new BaseError('UPDATE_FAILED', 'user was not updated!');
        }
        return updated[1][0];
    }

    public static async getNotifications(
        query: {
            offset?: string;
            limit?: string;
        },
        userId: number
    ): Promise<AppNotification[]> {
        const notifications = await this.appNotification.findAll({
            where: {
                userId,
            },
            offset: query.offset
                ? parseInt(query.offset, 10)
                : config.defaultOffset,
            limit: query.limit
                ? parseInt(query.limit, 10)
                : config.defaultLimit,
            order: [['createdAt', 'DESC']],
        });
        return notifications as AppNotification[];
    }

    public static async readNotifications(userId: number): Promise<boolean> {
        const updated = await this.appNotification.update(
            {
                read: true,
            },
            {
                returning: true,
                where: {
                    userId,
                },
            }
        );
        if (updated[0] === 0) {
            throw new Error('notifications were not updated!');
        }
        return true;
    }

    public static async getUnreadNotifications(
        userId: number
    ): Promise<number> {
        return this.appNotification.count({
            where: {
                userId,
                read: false,
            },
        });
    }

    public static async verifyNewsletterSubscription(
        address: string
    ): Promise<boolean> {
        try {
            const user = await UserService.get(address);
            if (!user?.email) {
                return false;
            }
            const contacts =
                await this.hubspotClient.crm.contacts.searchApi.doSearch({
                    query: user.email,
                    limit: 1,
                    properties: ['email', 'address'],
                    filterGroups: [],
                    sorts: ['email'],
                    after: 0,
                });

            if (contacts.body.results.length > 0) {
                return (
                    contacts.body.results[0].properties?.email ===
                        user.email.toLowerCase() &&
                    contacts.body.results[0].properties?.address === address
                );
            }

            return false;
        } catch (error) {
            throw error;
        }
    }

    public static async subscribeNewsletter(
        address: string,
        body: {
            subscribe: boolean;
        }
    ): Promise<boolean> {
        try {
            const user = await UserService.get(address);
            if (!user?.email) {
                throw new Error('User does not have email');
            }

            if (body.subscribe) {
                const createResponse =
                    await this.hubspotClient.crm.contacts.basicApi.create({
                        properties: {
                            email: user.email,
                            firstname: user.username ? user.username : '',
                            address,
                        },
                    });
                return !!createResponse && !!createResponse.body.id;
            } else {
                const contacts =
                    await this.hubspotClient.crm.contacts.searchApi.doSearch({
                        query: user.email,
                        limit: 1,
                        properties: ['email', 'address'],
                        filterGroups: [],
                        sorts: ['email'],
                        after: 0,
                    });
                if (contacts.body.results.length > 0) {
                    const hubsPotId = contacts.body.results[0].id;

                    if (!hubsPotId) {
                        throw new Error('User not found on HubsPot');
                    }

                    await this.hubspotClient.crm.contacts.basicApi.archive(
                        hubsPotId
                    );
                    return true;
                } else {
                    throw new Error('User not found on HubsPot');
                }
            }
        } catch (error) {
            if (error.response?.body?.category === 'CONFLICT') {
                throw new Error(error.response.body.message);
            }
            throw error;
        }
    }

    public static async delete(address: string): Promise<boolean> {
        try {
            const manager = await this.manager.findOne({
                where: { active: true, address },
            });

            if (manager) {
                const managersByCommunity = await this.manager.findAll({
                    where: {
                        active: true,
                        communityId: manager.communityId,
                    },
                    include: [
                        {
                            attributes: [],
                            model: this.appUser,
                            as: 'user',
                            required: true,
                            where: {
                                deletedAt: null,
                            },
                        },
                    ],
                });
                if (managersByCommunity.length <= 2) {
                    throw new BaseError(
                        'NOT_ENOUGH_MANAGERS',
                        'Not enough managers'
                    );
                }
            }

            const updated = await this.appUser.update(
                {
                    deletedAt: new Date(),
                },
                {
                    where: {
                        address,
                    },
                    returning: true,
                }
            );

            if (updated[0] === 0) {
                throw new BaseError('UPDATE_FAILED', 'User was not updated');
            }
            return true;
        } catch (error) {
            throw error;
        }
    }
}
