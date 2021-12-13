import { RequestWithUser } from '@ipcttypes/core';
import UserService from '@services/app/user';
import BeneficiaryService from '@services/ubi/beneficiary';
import ManagerService from '@services/ubi/managers';
import { standardResponse } from '@utils/api';
import { Logger } from '@utils/logger';
import { Request, Response } from 'express';

class UserController {
    public report = (req: Request, res: Response) => {
        const { communityId, message, category } = req.body;
        UserService.report(message, communityId, category)
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public auth = (req: Request, res: Response) => {
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
        UserService.authenticate(
            {
                address,
                language,
                currency,
                pushNotificationToken,
                username,
                year,
                children,
                avatarMediaId,
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
                UserService.setPushNotificationsToken(req.user.address, token);
            }
            UserService.hello(req.user.address, phone)
                .then((user) => standardResponse(res, 201, true, user))
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        } else {
            UserService.welcome(req.user.address, pushNotificationToken)
                .then((user) => standardResponse(res, 201, true, user))
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        }
    };

    public userExist = (req: Request, res: Response) => {
        UserService.exists(req.params.address)
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
        UserService.getPresignedUrlMedia(req.params.mime)
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateAvatar = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { mediaId } = req.body;
        UserService.updateAvatar(req.user.address, mediaId)
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
        UserService.setUsername(req.user.address, username)
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
        UserService.setCurrency(req.user.address, currency)
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
        UserService.setPushNotificationsToken(req.user.address, token)
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
        UserService.setLanguage(req.user.address, language)
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
        UserService.setGender(req.user.address, gender)
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
        UserService.setYear(req.user.address, new Date().getFullYear() - age)
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
        UserService.setChildren(req.user.address, children)
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
            avatarMediaId,
        } = req.body;
        UserService.authenticate({
            address,
            language,
            currency,
            pushNotificationToken,
            username,
            year,
            children,
            avatarMediaId,
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
            UserService.setPushNotificationsToken(address, token).catch((e) =>
                Logger.warn(`Error setting push notification token ` + e)
            );
        }
        UserService.hello(address, phone)
            .then((u) => res.send(u))
            .catch(() => res.sendStatus(403));
    };

    /**
     * @deprecated
     */
    public userExists = (req: Request, res: Response) => {
        UserService.exists(req.params.address)
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

        UserService.edit({ address: req.user.address, ...req.body })
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

        UserService.getNotifications(req.query, req.user.userId)
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

        UserService.readNotifications(req.user.userId)
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

        UserService.getUnreadNotifications(req.user.userId)
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

        UserService.verifyNewsletterSubscription(req.user.address)
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

        UserService.subscribeNewsletter(req.user.address, req.body)
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

        UserService.delete(req.user.address)
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
            BeneficiaryService.readRules(req.user.address)
                .then((r) => standardResponse(res, 200, true, r))
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        } else if (paths.includes('manager')) {
            ManagerService.readRules(req.user.address)
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

        BeneficiaryService.saveSurvery(req.user.address, req.body)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default UserController;
