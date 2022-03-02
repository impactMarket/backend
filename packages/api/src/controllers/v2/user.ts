import { services } from '@impactmarket/core';
import { Request, Response } from 'express';

import { RequestWithUser } from '../../middlewares/core';
import { standardResponse } from '../../utils/api';

class UserController {
    private userService: services.app.UserServiceV2;
    constructor() {
        this.userService = new services.app.UserServiceV2();
    }

    public create = (req: Request, res: Response) => {
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
        this.userService
            .create(
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
            .then((user) => standardResponse(res, 201, true, user))
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

        services.app.UserService.edit({
            address: req.user.address,
            ...req.body,
        })
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) =>
                standardResponse(res, 400, false, '', { error: e.message })
            );
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
}

export default UserController;
