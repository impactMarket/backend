import { Client } from '@hubspot/api-client';
import { Op, QueryTypes } from 'sequelize';

import config from '../../config';
import { models, sequelize } from '../../database';
import {
    AppAnonymousReport,
    AppAnonymousReportCreation,
} from '../../interfaces/app/appAnonymousReport';
import { LogTypes } from '../../interfaces/app/appLog';
import { AppNotification } from '../../interfaces/app/appNotification';
import {
    AppUser,
    AppUserCreationAttributes,
} from '../../interfaces/app/appUser';
import { BaseError } from '../../utils/baseError';
import { generateAccessToken } from '../../utils/jwt';
import { Logger } from '../../utils/logger';
import { createThumbnailUrl } from '../../utils/util';
import { IUserHello, IUserAuth, IBeneficiary, IManager } from '../endpoints';
import { ProfileContentStorage } from '../storage';
import CommunityService from '../ubi/community';
import UserLogService from './user/log';
import { getBeneficiariesByAddress } from '../../subgraph/queries/beneficiary';
import { BeneficiarySubgraph } from '../../subgraph/interfaces/beneficiary';
import { ethers } from 'ethers';

export default class UserService {
    public static sequelize = sequelize;
    public static appUser = models.appUser;
    public static manager = models.manager;
    public static appUserThroughTrust = models.appUserThroughTrust;
    public static appMediaContent = models.appMediaContent;
    public static appMediaThumbnail = models.appMediaThumbnail;
    public static appNotification = models.appNotification;

    private static profileContentStorage = new ProfileContentStorage();
    private static userLogService = new UserLogService();

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
                const existsPhone = user.phone
                    ? await this.existsAccountByPhone(user.phone, user.address)
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
                    await this.appUser.create(user)
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
                    where: { address: user.address },
                }))!.toJSON() as AppUser;
                if (userFromRegistry.avatarMediaPath) {
                    const thumbnails = createThumbnailUrl(
                        config.aws.bucket.profile,
                        userFromRegistry.avatarMediaPath,
                        config.thumbnails.profile
                    );
                    userFromRegistry.avatar = {
                        id: 0,
                        width: 0,
                        height: 0,
                        url: `${config.cloudfrontUrl}/${userFromRegistry.avatarMediaPath}`,
                        thumbnails,
                    };
                } else if (userFromRegistry.avatarMediaId) {
                    const media = await models.appMediaContent.findOne({
                        attributes: ['url', 'width', 'height'],
                        where: {
                            id: userFromRegistry.avatarMediaId,
                        },
                    });

                    if (media) {
                        const thumbnails = createThumbnailUrl(
                            config.aws.bucket.profile,
                            media.url.split(config.cloudfrontUrl + '/')[1],
                            config.thumbnails.profile
                        );
                        userFromRegistry.avatar = {
                            id: 0,
                            width: media.width,
                            height: media.height,
                            url: media.url,
                            thumbnails,
                        };
                    }
                }
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
                where: {
                    address: {
                        [Op.not]: user.address,
                    },
                    phone: user.phone,
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
            where: { address },
        });
        if (user === null) {
            throw new BaseError('USER_NOT_FOUND', address + ' user not found!');
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
        avatarMediaId: number,
        avatarMediaPath: string
    ): Promise<boolean> {
        const updated = await this.appUser.update(
            { avatarMediaId, avatarMediaPath },
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

    public static async existsAccountByPhone(
        phone: string,
        address: string
    ): Promise<boolean> {
        const user = await models.appUser.findOne({
            where: {
                phone,
                address: {
                    [Op.not]: address,
                },
                active: true,
            },
        });

        return !!user;
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
        const getBeneficiaries = await getBeneficiariesByAddress([user.address], 'state_not: 1');
        let beneficiary: BeneficiarySubgraph | null = null;
        if (getBeneficiaries && getBeneficiaries.length > 0) {
            beneficiary = getBeneficiaries[0];
        }

        let manager: IManager | null = await this.manager.findOne({
            attributes: ['readRules', 'communityId'],
            where: { active: true, address: user.address },
        });

        // get user community
        let managerInPendingCommunity = false;
        // reusable method

        if (!beneficiary && !manager) {
            const communityId = await CommunityService.findByFirstManager(
                user.address
            );
            if (communityId) {
                managerInPendingCommunity = true;
                manager = {
                    communityId,
                    readRules: false,
                };
            }
        }
        // until here

        let communityId: number | undefined = undefined;
        if (manager?.communityId) {
            communityId = manager.communityId;
        } else if (beneficiary?.community.id) {
            const community = await models.community.findOne({
                attributes: ['id'],
                where: {
                    contractAddress: ethers.utils.getAddress(beneficiary.community.id),
                }
            });
            if (community) {
                communityId = community?.id;
            }
        }

        return {
            isBeneficiary: beneficiary !== null, // TODO: deprecated
            isManager: manager !== null || managerInPendingCommunity, // TODO: deprecated
            blocked: beneficiary !== null && beneficiary.state === 2, // TODO: deprecated
            verifiedPN:
                user.trust && user.trust.length !== 0
                    ? user.trust[0].verifiedPhoneNumber
                    : undefined, // TODO: deprecated in mobile-app@1.1.5
            suspect: user.suspect, // TODO: deprecated
            communityId, // TODO: deprecated
            user: {
                suspect: user.suspect,
            },
            manager,
            beneficiary: beneficiary ? {
                blocked: beneficiary.state === 2,
                communityId,
                readRules: user.readBeneficiaryRules,
            } as any : null,
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

        this.userLogService.create(
            updated[1][0].id,
            LogTypes.EDITED_PROFILE,
            user
        );

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
