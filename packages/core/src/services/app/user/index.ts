import { ethers } from 'ethers';
import { Op } from 'sequelize';

import config from '../../../config';
import { models, sequelize } from '../../../database';
import { AppUserModel } from '../../../database/models/app/appUser';
import { LogTypes } from '../../../interfaces/app/appLog';
import { AppNotification } from '../../../interfaces/app/appNotification';
import {
    AppUserCreationAttributes,
    AppUserUpdate,
    AppUser,
} from '../../../interfaces/app/appUser';
import { ProfileContentStorage } from '../../../services/storage';
import { getAllBeneficiaries } from '../../../subgraph/queries/beneficiary';
import { getUserRoles } from '../../../subgraph/queries/user';
import { BaseError } from '../../../utils/baseError';
import { generateAccessToken } from '../../../utils/jwt';
import { Logger } from '../../../utils/logger';
import { sendPushNotification } from '../../../utils/util';
import UserLogService from './log';

export default class UserService {
    private userLogService = new UserLogService();
    private profileContentStorage = new ProfileContentStorage();

    public async create(
        userParams: AppUserCreationAttributes,
        overwrite: boolean = false,
        recover: boolean = false,
        clientId?: string
    ) {
        const exists = await this._exists(userParams.address);

        if (overwrite) {
            await this._overwriteUser(userParams);
        } else {
            // a user might be connecting with the same phone number
            // as an existing user
            const existsPhone = userParams.phone
                ? await this._existsAccountByPhone(
                      userParams.phone,
                      userParams.address
                  )
                : false;

            if (existsPhone)
                throw new BaseError(
                    'PHONE_CONFLICT',
                    'phone associated with another account'
                );
        }

        if (recover) {
            await this._recoverAccount(userParams.address);
        }

        let user: AppUserModel;
        if (!exists) {
            // create new user
            // including their phone number information, if it exists
            user = await models.appUser.create(userParams);
        } else {
            if (userParams.pushNotificationToken) {
                models.appUser.update(
                    {
                        pushNotificationToken: userParams.pushNotificationToken,
                    },
                    { where: { address: userParams.address } }
                );
            }
            // it's not null at this point
            user = (await models.appUser.findOne({
                where: { address: userParams.address },
            }))!;
            // if the account doesn't have a phone number
            // but it's being provided now, add it
            // otherwise, verify if account phone number and
            // provided phone number are the same
            const jsonUser = user.toJSON();
            if (!jsonUser.phone && userParams.phone) {
                await models.appUser.update(
                    {
                        phone: userParams.phone,
                    },
                    {
                        where: {
                            id: jsonUser.id,
                        },
                    }
                );
                user.phone = userParams.phone;
            } else if (
                jsonUser.phone &&
                userParams.phone &&
                userParams.phone !== jsonUser.phone
            ) {
                throw new BaseError(
                    'DIFFERENT_PHONE',
                    'phone associated with account is different'
                );
            }
        }

        if (!user.active) {
            throw new BaseError('INACTIVE_USER', 'user is inactive');
        }

        if (user.deletedAt) {
            throw new BaseError(
                'DELETION_PROCESS',
                'account in deletion process'
            );
        }

        this._updateLastLogin(user.id);

        let token: string;
        if (clientId) {
            const credential = await models.appClientCredential.findOne({
                where: {
                    clientId,
                    status: 'active',
                },
            });
            if (credential) {
                token = generateAccessToken(
                    userParams.address,
                    user.id,
                    clientId
                );
            } else {
                throw new BaseError(
                    'INVALID_CREDENTIAL',
                    'Client credential is invalid'
                );
            }
        } else {
            // generate access token for future interactions that require authentication
            token = generateAccessToken(userParams.address, user.id);
        }

        const jsonUser = user.toJSON();
        return {
            ...jsonUser,
            ...(await this._userRoles(user.address)),
            ...(await this._userRules(user.address)),
            token,
        };
    }

    public async get(address: string) {
        const user = await models.appUser.findOne({
            where: { address },
        });
        if (user === null) {
            throw new BaseError('USER_NOT_FOUND', 'user not found');
        }
        return {
            ...user.toJSON(),
            ...(await this._userRoles(user.address)),
            ...(await this._userRules(user.address)),
        };
    }

    public async findUserBy(address: string, userAddress: string) {
        const userRoles = await this._userRoles(userAddress);

        if (
            !userRoles.ambassador &&
            !userRoles.manager &&
            !userRoles.councilMember
        ) {
            throw new BaseError(
                'UNAUTHORIZED',
                'user must be ambassador, manager or council member'
            );
        }

        const user = await models.appUser.findOne({
            where: {
                address,
            },
        });

        const roles = await this._userRoles(address);

        if (!user && roles.roles.length === 0) {
            throw new BaseError('USER_NOT_FOUND', 'user not found');
        }

        return {
            address,
            ...user?.toJSON(),
            ...roles,
            ...(await this._userRules(address)),
        };
    }

    public async update(user: AppUserUpdate) {
        if (user.phone) {
            const existsPhone = await this._existsAccountByPhone(
                user.phone,
                user.address
            );

            if (existsPhone)
                throw new BaseError(
                    'PHONE_CONFLICT',
                    'phone associated with another account'
                );
        }

        const updated = await models.appUser.update(user, {
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

        return {
            ...updated[1][0].toJSON(),
            ...(await this._userRoles(user.address)),
            ...(await this._userRules(user.address)),
        };
    }

    public async patch(address: string, action: string) {
        if (action === 'beneficiary-rules') {
            await models.appUser.update(
                { readBeneficiaryRules: true },
                {
                    where: { address },
                }
            );
        } else if (action === 'manager-rules') {
            await models.manager.update(
                { readRules: true },
                {
                    where: { address },
                }
            );
        }
    }

    public async delete(address: string): Promise<boolean> {
        const roles = await getUserRoles(address);

        if (roles.manager !== null && roles.manager.state === 0) {
            throw new BaseError(
                'MANAGER',
                "Active managers can't delete accounts"
            );
        }

        const updated = await models.appUser.update(
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
    }

    public async report(
        message: string,
        communityId: number,
        category: 'general' | 'potential-fraud'
    ) {
        await models.anonymousReport.create({
            message,
            communityId,
            category,
        });
        return true;
    }

    public async getReport(
        user: string,
        query: { offset?: string; limit?: string }
    ) {
        const communities = await models.community.findAll({
            attributes: ['id'],
            where: {
                ambassadorAddress: user,
            },
        });

        if (!communities || communities.length === 0) {
            throw new BaseError(
                'COMMUNITY_NOT_FOUND',
                'no community found for this ambassador'
            );
        }

        return models.anonymousReport.findAndCountAll({
            include: [
                {
                    attributes: [
                        'id',
                        'contractAddress',
                        'name',
                        'coverMediaPath',
                    ],
                    model: models.community,
                    as: 'community',
                },
            ],
            where: {
                communityId: {
                    [Op.in]: communities.map((c) => c.id),
                },
            },
            offset: query.offset
                ? parseInt(query.offset, 10)
                : config.defaultOffset,
            limit: query.limit
                ? parseInt(query.limit, 10)
                : config.defaultLimit,
        });
    }

    public async getPresignedUrlMedia(mime: string): Promise<{
        uploadURL: string;
        filename: string;
    }> {
        return this.profileContentStorage.getPresignedUrlPutObject(mime);
    }

    private async _recoverAccount(address: string) {
        try {
            await models.appUser.update(
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

    public async getNotifications(
        query: {
            offset?: string;
            limit?: string;
        },
        userId: number
    ): Promise<{
        count: number;
        rows: AppNotification[];
    }> {
        const notifications = await models.appNotification.findAndCountAll({
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
        return {
            count: notifications.count,
            rows: notifications.rows as AppNotification[],
        };
    }

    public async readNotifications(
        userId: number,
        notifications?: number[]
    ): Promise<boolean> {
        const updated = await models.appNotification.update(
            {
                read: true,
            },
            {
                returning: true,
                where: {
                    userId,
                    id: {
                        [Op.in]: notifications,
                    },
                },
            }
        );
        if (updated[0] === 0) {
            throw new BaseError(
                'UPDATE_FAILED',
                'notifications were not updated!'
            );
        }
        return true;
    }

    public async getUnreadNotifications(userId: number): Promise<number> {
        return models.appNotification.count({
            where: {
                userId,
                read: false,
            },
        });
    }

    public async sendPushNotifications(
        title: string,
        body: string,
        country?: string,
        communitiesIds?: number[],
        data?: any
    ) {
        if (country) {
            const users = await models.appUser.findAll({
                attributes: ['pushNotificationToken'],
                where: {
                    country,
                    pushNotificationToken: {
                        [Op.not]: null,
                    },
                },
            });
            users.forEach((user) => {
                sendPushNotification(
                    user.address,
                    title,
                    body,
                    data,
                    user.pushNotificationToken
                );
            });
        } else if (communitiesIds && communitiesIds.length) {
            const communities = await models.community.findAll({
                attributes: ['contractAddress'],
                where: {
                    id: {
                        [Op.in]: communitiesIds,
                    },
                    contractAddress: {
                        [Op.not]: null,
                    },
                },
            });
            const beneficiaryAddress: string[] = [];

            // get beneficiaries
            for (let index = 0; index < communities.length; index++) {
                const community = communities[index];
                const beneficiaries = await getAllBeneficiaries(
                    community.contractAddress!
                );
                beneficiaries.forEach((beneficiary) => {
                    beneficiaryAddress.push(
                        ethers.utils.getAddress(beneficiary.address)
                    );
                });
            }
            // get users
            const users = await models.appUser.findAll({
                attributes: ['pushNotificationToken'],
                where: {
                    address: {
                        [Op.in]: beneficiaryAddress,
                    },
                    pushNotificationToken: {
                        [Op.not]: null,
                    },
                },
            });

            users.forEach((user) => {
                sendPushNotification(
                    user.address,
                    title,
                    body,
                    data,
                    user.pushNotificationToken
                );
            });
        } else {
            throw new BaseError('INVALID_OPTION', 'invalid option');
        }
    }

    private async _overwriteUser(user: AppUserCreationAttributes) {
        try {
            const usersToInactive = await models.appUser.findAll({
                where: {
                    phone: user.phone,
                    address: {
                        [Op.not]: user.address,
                    },
                },
            });

            const promises = usersToInactive.map((el) =>
                models.appUser.update(
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
                models.appUser.update(
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

    private async _exists(address: string): Promise<boolean> {
        const exists = await models.appUser.findOne({
            attributes: ['address'],
            where: { address },
            raw: true,
        });
        return exists !== null;
    }

    /**
     * Verify if there is any other account different than `address`
     * with the same `phone`.
     * @param phone number to verify
     * @param address address to verify
     * @returns {bool} true if there is any other account with the same phone
     */
    private async _existsAccountByPhone(
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

    private async _updateLastLogin(id: number): Promise<void> {
        const t = await sequelize.transaction();
        try {
            await models.appUser.update(
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

    private async _userRoles(address: string) {
        const userRoles = await getUserRoles(address);
        const roles: string[] = [];
        const keys = Object.keys(userRoles);
        keys.forEach((key) => {
            if (userRoles[key]) {
                roles.push(key);
            }
        });

        const pendingCommunity = await models.community.findOne({
            where: {
                status: 'pending',
                requestByAddress: address,
            },
        });
        if (pendingCommunity) roles.push('pendingManager');

        return {
            ...userRoles,
            roles,
        };
    }

    private async _userRules(address: string) {
        const [beneficiaryRules, managerRules] = await Promise.all([
            models.appUser.findOne({
                attributes: ['readBeneficiaryRules'],
                where: { address },
            }),
            models.manager.findOne({
                attributes: ['readRules'],
                where: { address },
            }),
        ]);

        return {
            beneficiaryRules: beneficiaryRules?.readBeneficiaryRules,
            managerRules: managerRules?.readRules,
        };
    }
}
