import { services } from '@impactmarket/core';
import { Request, Response } from 'express';

import { RequestWithUser } from '../../middlewares/core';
import { standardResponse } from '../../utils/api';

class UserController {
    private userService: services.app.UserServiceV2;
    private userLogService: services.app.UserLogService;

    constructor() {
        this.userService = new services.app.UserServiceV2();
        this.userLogService = new services.app.UserLogService();
    }

    public create = (req: Request, res: Response) => {
        const {
            address,
            phone,
            language,
            currency,
            pushNotificationToken,
            username,
            age,
            children,
            avatarMediaPath,
            email,
            overwrite,
            recover,
            clientId,
        } = req.body;
        this.userService
            .create(
                {
                    address,
                    language,
                    currency,
                    pushNotificationToken,
                    username,
                    year: age ? new Date().getUTCFullYear() - age : undefined,
                    children,
                    avatarMediaPath,
                    email,
                    trust: {
                        phone,
                    },
                },
                overwrite,
                recover,
                clientId,
            )
            .then((user) => standardResponse(res, 201, true, user))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public get = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.userService
            .get(req.user.address)
            .then((user) =>
                standardResponse(res, 201, true, {
                    ...user,
                    age: user.year
                        ? new Date().getUTCFullYear() - user.year
                        : null,
                })
            )
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public update = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        const {
            language,
            currency,
            pushNotificationToken,
            username,
            age,
            children,
            avatarMediaPath,
            email,
        } = req.body;
        this.userService
            .update({
                address: req.user.address,
                language,
                currency,
                pushNotificationToken,
                username,
                year: age ? new Date().getUTCFullYear() - age : undefined,
                children,
                avatarMediaPath,
                email,
            })
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) =>
                standardResponse(res, 400, false, '', { error: e.message })
            );
    };

    public patch = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        this.userService
            .patch(req.user.address, req.body.action)
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

        this.userService
            .delete(req.user.address)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public report = (req: Request, res: Response) => {
        const { communityId, message, category } = req.body;
        this.userService
            .report(message, communityId, category)
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public getLogs = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        const { type, entity } = req.query;

        if (type === undefined || entity === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'INVALID_QUERY',
                    message: 'missing type or entity',
                },
            });
            return;
        }

        this.userLogService
            .get(req.user.address, type as string, entity as string)
            .then((r) => standardResponse(res, 201, true, r))
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

        this.userService
            .getPresignedUrlMedia(req.params.mime)
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default UserController;
