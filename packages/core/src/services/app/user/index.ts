import { Op, QueryTypes } from 'sequelize';

import { models, sequelize } from '../../../database';
import {
    AppUser,
    AppUserCreationAttributes,
} from '../../../interfaces/app/appUser';
import { getUserRoles } from '../../../subgraph/queries/community';
import { BaseError } from '../../../utils/baseError';
import { generateAccessToken } from '../../../utils/jwt';
import { Logger } from '../../../utils/logger';

export default class UserService {
    public async create(
        userParams: AppUserCreationAttributes,
        overwrite: boolean = false,
        recover: boolean = false
    ) {
        try {
            // generate access token for future interactions that require authentication
            const exists = await this._exists(userParams.address);

            if (overwrite) {
                await this._overwriteUser(userParams);
            } else if (!exists) {
                const existsPhone = userParams.trust?.phone
                    ? await this._existsAccountByPhone(userParams.trust.phone)
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

            let user: AppUser;
            if (!exists) {
                // create new user, including their phone number information
                user = (
                    await models.appUser.create(userParams, {
                        include: [
                            {
                                model: models.appUserTrust,
                                as: 'trust',
                            },
                        ],
                    })
                ).toJSON() as AppUser;
            } else {
                if (userParams.pushNotificationToken) {
                    models.appUser.update(
                        {
                            pushNotificationToken:
                                userParams.pushNotificationToken,
                        },
                        { where: { address: userParams.address } }
                    );
                }
                // it's not null at this point
                user = (await models.appUser.findOne({
                    include: [
                        {
                            model: models.appUserTrust,
                            as: 'trust',
                        },
                    ],
                    where: { address: userParams.address },
                }))!.toJSON() as AppUser;
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
            const token = generateAccessToken(userParams.address, user.id);

            return {
                ...user,
                ...(await this._userRoles(user.address)),
                token,
            };
        } catch (e) {
            Logger.warn(`Error while auth user ${userParams.address} ${e}`);
            throw e;
        }
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
            ...(await this._userRoles(user.toJSON().address)),
        };
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

    private async _overwriteUser(user: AppUserCreationAttributes) {
        try {
            const usersToInactive = await models.appUser.findAll({
                include: [
                    {
                        model: models.appUserTrust,
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

    private async _existsAccountByPhone(phone: string): Promise<boolean> {
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
        return await getUserRoles(address);
    }
}
