import { Request, Response } from 'express';
import { getAddress } from '@ethersproject/address';

import { AttestationType, send, verify } from '~services/attestation';
import { ListUserNotificationsRequestSchema } from '~validators/user';
import { RequestWithUser } from '~middlewares/core';
import { ValidatedRequest } from '~utils/queryValidator';
import { standardResponse } from '~utils/api';
import UserLogService from '~services/app/user/log';
import UserService from '~services/app/user';

class UserController {
    private userService: UserService;
    private userLogService: UserLogService;

    constructor() {
        this.userService = new UserService();
        this.userLogService = new UserLogService();
    }

    public create = (req: RequestWithUser, res: Response) => {
        const {
            address,
            phone,
            language,
            currency,
            walletPNT,
            appPNT,
            firstName,
            lastName,
            age,
            children,
            avatarMediaPath,
            email,
            gender,
            bio,
            overwrite,
            recover
        } = req.body;
        this.userService
            .create(
                {
                    address,
                    language,
                    currency,
                    walletPNT,
                    appPNT,
                    firstName,
                    lastName,
                    year: age ? new Date().getUTCFullYear() - age : undefined,
                    children,
                    avatarMediaPath,
                    email,
                    gender,
                    bio,
                    phone,
                    clientId: req.clientId
                },
                overwrite,
                recover,
                req.ip
            )
            .then(user =>
                standardResponse(res, 201, true, {
                    ...user,
                    age: user.year ? new Date().getUTCFullYear() - user.year : null
                })
            )
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    public get = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }
        this.userService
            .get(req.user.address, req.clientId, req.ip)
            .then(
                user =>
                    !req.timedout &&
                    standardResponse(res, 201, true, {
                        ...user,
                        age: user.year ? new Date().getUTCFullYear() - user.year : null
                    })
            )
            .catch(e => !req.timedout && standardResponse(res, 400, false, '', { error: e }));
    };

    public getUserFromAuthorizedAccount = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        const { address } = req.params;

        this.userService
            .getUserFromAuthorizedAccount(getAddress(address), req.user.address)
            .then(community => !req.timedout && standardResponse(res, 200, true, community))
            .catch(e => !req.timedout && standardResponse(res, 400, false, '', { error: e }));
    };

    public update = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        const {
            language,
            currency,
            walletPNT,
            appPNT,
            firstName,
            lastName,
            age,
            children,
            avatarMediaPath,
            email,
            gender,
            bio,
            country,
            phone
        } = req.body;
        this.userService
            .update(
                {
                    address: req.user.address,
                    language,
                    currency,
                    walletPNT,
                    appPNT,
                    firstName,
                    lastName,
                    children,
                    avatarMediaPath,
                    email,
                    gender,
                    bio,
                    country,
                    phone,
                    ...(age && { year: new Date().getUTCFullYear() - age })
                },
                req.clientId
            )
            .then(user =>
                standardResponse(res, 200, true, {
                    ...user,
                    age: user.year ? new Date().getUTCFullYear() - user.year : null
                })
            )
            .catch(e => standardResponse(res, 400, false, '', { error: e.message }));
    };

    public patch = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        this.userService
            .patch(req.user.address, req.body.action)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    public delete = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        this.userService
            .delete(req.user.address)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    public report = (req: Request, res: Response) => {
        const { communityId, message, category } = req.body;
        this.userService
            .report(message, communityId, category)
            .then(r => standardResponse(res, 201, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    public getReport = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        this.userService
            .getReport(req.user.address, req.query)
            .then(r => !req.timedout && standardResponse(res, 201, true, r))
            .catch(e => !req.timedout && standardResponse(res, 400, false, '', { error: e }));
    };

    public getLogs = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        const { type, entity } = req.query;

        if (
            type === undefined ||
            entity === undefined ||
            !(typeof type === 'string') ||
            !(typeof entity === 'string')
        ) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'INVALID_QUERY',
                    message: 'missing type or entity'
                }
            });
            return;
        }

        this.userLogService
            .get(req.user.address, type, entity)
            .then(r => !req.timedout && standardResponse(res, 201, true, r))
            .catch(e => !req.timedout && standardResponse(res, 400, false, '', { error: e }));
    };

    public getPresignedUrlMedia = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        const { mime } = req.query;

        if (mime === undefined || !(typeof mime === 'string')) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'INVALID_QUERY',
                    message: 'missing mime'
                }
            });
            return;
        }

        this.userService
            .getPresignedUrlMedia(mime)
            .then(r => !req.timedout && standardResponse(res, 201, true, r))
            .catch(e => !req.timedout && standardResponse(res, 400, false, '', { error: e }));
    };

    public getNotifications = (
        req: RequestWithUser & ValidatedRequest<ListUserNotificationsRequestSchema>,
        res: Response
    ) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        this.userService
            .getNotifications(req.query, req.user.userId)
            .then(r => !req.timedout && standardResponse(res, 200, true, r))
            .catch(e => !req.timedout && standardResponse(res, 400, false, '', { error: e.message }));
    };

    public readNotifications = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        const notifications = req.body.notifications;

        this.userService
            .readNotifications(req.user.userId, notifications)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e.message }));
    };

    public sendPushNotifications = (req: Request, res: Response) => {
        const { country, communities, title, body, data } = req.body;

        this.userService
            .sendPushNotifications(title, body, country, communities, data)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e.message }));
    };
    public requestVerify = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }
        const { plainTextIdentifier, type } = req.body;

        send(plainTextIdentifier, type, req.user.userId)
            .then(r => standardResponse(res, 200, true, r, {}))
            .catch(e => standardResponse(res, 400, false, '', { error: e.message }));
    };
    public verify = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }
        const { plainTextIdentifier, code } = req.body;

        verify(plainTextIdentifier, AttestationType.EMAIL_LINK, code!, req.user.userId)
            .then(r => standardResponse(res, 200, true, r, {}))
            .catch(e => standardResponse(res, 400, false, '', { error: e.message }));
    };
}

export default UserController;
