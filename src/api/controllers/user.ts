import { RequestWithUser } from '@ipcttypes/core';
import UserService from '@services/app/user';
import { controllerLogAndFail, standardResponse } from '@utils/api';
import { Logger } from '@utils/logger';
import crypto from 'crypto';
import { Request, Response } from 'express';

import config from '../../config';

class UserController {
    public report = (req: Request, res: Response) => {
        const { communityId, message } = req.body;
        UserService.report(communityId, message)
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public auth = (req: Request, res: Response) => {
        const {
            address,
            language,
            currency,
            pushNotificationToken,
            phone,
        } = req.body;
        UserService.authenticate(
            address,
            language,
            currency,
            pushNotificationToken,
            phone
        )
            .then((user) => standardResponse(res, 201, true, user))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public welcome = (req: Request, res: Response) => {
        const { address, token, phone } = req.body;
        if (token.length > 0) {
            // failing to set the push notification, should not be a blocker!
            UserService.setPushNotificationsToken(address, token);
        }
        UserService.hello(address, phone)
            .then((user) => standardResponse(res, 201, true, user))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public userExist = (req: Request, res: Response) => {
        UserService.exists(req.params.address)
            .then((user) => standardResponse(res, 201, true, user))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateUsername = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            controllerLogAndFail('User not identified!', 400, res);
            return;
        }
        const { username } = req.body;
        UserService.setUsername(req.user.address, username)
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateCurrency = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            controllerLogAndFail('User not identified!', 400, res);
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
            controllerLogAndFail('User not identified!', 400, res);
            return;
        }
        const { token } = req.body;
        UserService.setPushNotificationsToken(req.user.address, token)
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateLanguage = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            controllerLogAndFail('User not identified!', 400, res);
            return;
        }
        const { language } = req.body;
        UserService.setLanguage(req.user.address, language)
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateGender = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            controllerLogAndFail('User not identified!', 400, res);
            return;
        }
        const { gender } = req.body;
        UserService.setGender(req.user.address, gender)
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public updateAge = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            controllerLogAndFail('User not identified!', 400, res);
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
            controllerLogAndFail('User not identified!', 400, res);
            return;
        }
        const { children } = req.body;
        UserService.setChildren(req.user.address, children)
            .then((r) => standardResponse(res, 201, r, ''))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    public pictureAdd = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            controllerLogAndFail('User not identified!', 400, res);
            return;
        }
        UserService.setProfilePicture(req.user.address, req.file)
            .then((r) => res.send(r))
            .catch((e) => controllerLogAndFail(e, 400, res));
    };

    /**
     * @deprecated
     */
    public device = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            controllerLogAndFail('User not identified!', 400, res);
            return;
        }
        const { phone, identifier, device, network } = req.body;
        const hashPhone = crypto
            .createHmac('sha256', config.hashKey)
            .update(phone)
            .digest('hex');
        const hashNetwork = crypto
            .createHmac('sha256', config.hashKey)
            .update(network)
            .digest('hex');

        UserService.setDevice({
            userAddress: req.user.address,
            phone: hashPhone,
            identifier,
            device,
            network: hashNetwork,
            lastLogin: new Date(),
        })
            .then(() => res.sendStatus(200))
            .catch(() => res.sendStatus(400));
    };

    /**
     * @deprecated
     */
    public authenticate = (req: Request, res: Response) => {
        const {
            address,
            language,
            currency,
            pushNotificationToken,
            phone,
        } = req.body;
        UserService.authenticate(
            address,
            language,
            currency,
            pushNotificationToken,
            phone
        )
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
            .catch((e) => controllerLogAndFail(e, 403, res));
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
            .catch((e) => controllerLogAndFail(e, 404, res));
    };
}

export default UserController;
