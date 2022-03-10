import { utils, services, database, config } from '@impactmarket/core';
import { Request, Response } from 'express';

import { RequestWithUser } from '../middlewares/core';
import { standardResponse } from '../utils/api';

class UserController {
    public report = (req: Request, res: Response) => {
        const { communityId, message, category } = req.body;
        services.app.UserService.report(message, communityId, category)
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public auth = async (req: Request, res: Response) => {
        const {
            address,
            phone,
            language,
            currency,
            pushNotificationToken,
            username,
            year,
            children,
            avatarMediaId,
            overwrite,
            recover,
        } = req.body;

        const appMedia = await database.models.appMediaContent.findOne({
            attributes: ['url'],
            where: {
                id: avatarMediaId,
            },
        });
        const avatarMediaPath = appMedia!.url.replace(
            `${config.cloudfrontUrl}/`,
            ''
        );

        services.app.UserService.authenticate(
            {
                address,
                language,
                currency,
                pushNotificationToken,
                username,
                year,
                children,
                avatarMediaPath,
                trust: {
                    phone,
                },
            },
            overwrite,
            recover
        )
            .then((user) => standardResponse(res, 201, true, user))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public welcome = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { token, phone, pushNotificationToken } = req.body;
        // TODO: deprecated in mobile-app@1.1.5
        if (token !== undefined && phone !== undefined) {
            if (token.length > 0) {
                // failing to set the push notification, should not be a blocker!
                services.app.UserService.setPushNotificationsToken(
                    req.user.address,
                    token
                );
            }
            services.app.UserService.hello(req.user.address, phone)
                .then((user) => standardResponse(res, 201, true, user))
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        } else {
            services.app.UserService.welcome(
                req.user.address,
                pushNotificationToken
            )
                .then((user) => standardResponse(res, 201, true, user))
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        }
    };

    public userExist = (req: Request, res: Response) => {
        services.app.UserService.exists(req.params.address)
            .then((user) => standardResponse(res, 201, true, user))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public getPresignedUrlMedia = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        services.app.UserService.getPresignedUrlMedia(req.params.mime)
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateAvatar = async (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { avatarMediaId } = req.body;
        const appMedia = await database.models.appMediaContent.findOne({
            attributes: ['url'],
            where: {
                id: avatarMediaId,
            },
        });
        const avatarMediaPath = appMedia!.url.replace(
            `${config.cloudfrontUrl}/`,
            ''
        );
        services.app.UserService.updateAvatar(req.user.address, avatarMediaPath)
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateUsername = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { username } = req.body;
        services.app.UserService.setUsername(req.user.address, username)
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateCurrency = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { currency } = req.body;
        services.app.UserService.setCurrency(req.user.address, currency)
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updatePushNotificationsToken = (
        req: RequestWithUser,
        res: Response
    ) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { token } = req.body;
        services.app.UserService.setPushNotificationsToken(
            req.user.address,
            token
        )
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateLanguage = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { language } = req.body;
        services.app.UserService.setLanguage(req.user.address, language)
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateGender = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { gender } = req.body;
        services.app.UserService.setGender(req.user.address, gender)
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateAge = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { age } = req.body;
        services.app.UserService.setYear(
            req.user.address,
            new Date().getFullYear() - age
        )
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    /**
     * don't even dare! They'll update you first
     */
    public updateChildren = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { children } = req.body;
        services.app.UserService.setChildren(req.user.address, children)
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    /**
     * @deprecated
     */
    public device = (req: RequestWithUser, res: Response) => {
        res.sendStatus(200);
    };

    /**
     * @deprecated
     */
    public authenticate = (req: Request, res: Response) => {
        const {
            address,
            phone,
            language,
            currency,
            pushNotificationToken,
            username,
            year,
            children,
        } = req.body;
        services.app.UserService.authenticate({
            address,
            language,
            currency,
            pushNotificationToken,
            username,
            year,
            children,
            trust: {
                phone,
            },
        })
            .then((user) => res.send(user))
            .catch((e) => res.status(403).send(e));
    };

    /**
     * @deprecated
     */
    public hello = (req: Request, res: Response) => {
        const { address, token, phone } = req.body;
        if (token.length > 0) {
            // failing to set the push notification, should not be a blocker!
            services.app.UserService.setPushNotificationsToken(
                address,
                token
            ).catch((e) =>
                utils.Logger.warn(`Error setting push notification token ` + e)
            );
        }
        services.app.UserService.hello(address, phone)
            .then((u) => res.send(u))
            .catch(() => res.sendStatus(403));
    };

    /**
     * @deprecated
     */
    public userExists = (req: Request, res: Response) => {
        services.app.UserService.exists(req.params.address)
            .then((u) => {
                if (u === false) {
                    res.sendStatus(404);
                } else {
                    res.send('OK');
                }
            })
            .catch(() => res.sendStatus(404));
    };

    public edit = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        services.app.UserService.edit({
            address: req.user.address,
            ...req.body,
        })
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) =>
                standardResponse(res, 400, false, '', { error: e.message })
            );
    };

    public getNotifications = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        services.app.UserService.getNotifications(req.query, req.user.userId)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) =>
                standardResponse(res, 400, false, '', { error: e.message })
            );
    };

    public readNotifications = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        services.app.UserService.readNotifications(req.user.userId)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) =>
                standardResponse(res, 400, false, '', { error: e.message })
            );
    };

    public getUnreadNotifications = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        services.app.UserService.getUnreadNotifications(req.user.userId)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) =>
                standardResponse(res, 400, false, '', { error: e.message })
            );
    };

    // public delete = (req: RequestWithUser, res: Response) => {
    public verifyNewsletterSubscription = (
        req: RequestWithUser,
        res: Response
    ) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        services.app.UserService.verifyNewsletterSubscription(req.user.address)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) =>
                standardResponse(res, 400, false, '', { error: e.message })
            );
    };

    public subscribeNewsletter = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        services.app.UserService.subscribeNewsletter(req.user.address, req.body)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public delete = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        services.app.UserService.delete(req.user.address)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    readRules = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        const paths = req.path.split('/');
        if (paths.includes('beneficiary')) {
            services.ubi.BeneficiaryService.readRules(req.user.address)
                .then((r) => standardResponse(res, 200, true, r))
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        } else if (paths.includes('manager')) {
            services.ubi.ManagerService.readRules(req.user.address)
                .then((r) => standardResponse(res, 200, true, r))
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        } else {
            standardResponse(res, 404, false, '', {
                error: {
                    name: 'NOT_FOUND',
                    message: 'invalid endpoint address',
                },
            });
        }
    };

    public saveSurvey = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        services.ubi.BeneficiaryService.saveSurvery(req.user.address, req.body)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default UserController;
