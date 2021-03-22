import UserService from '@services/user';
import { controllerLogAndFail } from '@utils/api';
import { Logger } from '@utils/logger';
import { Request, Response } from 'express';
import crypto from 'crypto';
import config from '../../config';

class UserController {
    public report = (req: Request, res: Response) => {
        const { communityId, message } = req.body;
        if (message.length === 0) {
            res.sendStatus(200); // TODO: it's not ok. Will be removed, see validator step
            return;
        }
        UserService.report(communityId, message)
            .then((r) => res.send(r))
            .catch((e) => res.status(403).send(e));
    };

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

    public updateUsername = (req: Request, res: Response) => {
        const { address, username } = req.body;
        UserService.setUsername(address, username)
            .then(() => res.sendStatus(200))
            .catch((e) => controllerLogAndFail(e, 400, res));
    };

    public updateCurrency = (req: Request, res: Response) => {
        const { address, currency } = req.body;
        UserService.setCurrency(address, currency)
            .then(() => res.sendStatus(200))
            .catch((e) => controllerLogAndFail(e, 400, res));
    };

    public updatePushNotificationsToken = (req: Request, res: Response) => {
        const { address, token } = req.body;
        UserService.setPushNotificationsToken(address, token)
            .then(() => res.sendStatus(200))
            .catch((e) => controllerLogAndFail(e, 400, res));
    };

    public updateLanguage = (req: Request, res: Response) => {
        const { address, language } = req.body;
        UserService.setLanguage(address, language)
            .then(() => res.sendStatus(200))
            .catch((e) => controllerLogAndFail(e, 400, res));
    };

    public updateGender = (req: Request, res: Response) => {
        const { address, gender } = req.body;
        UserService.setGender(address, gender)
            .then(() => res.sendStatus(200))
            .catch((e) => controllerLogAndFail(e, 400, res));
    };

    public updateAge = (req: Request, res: Response) => {
        const { address, age } = req.body;
        UserService.setYear(address, new Date().getFullYear() - age)
            .then(() => res.sendStatus(200))
            .catch((e) => controllerLogAndFail(e, 400, res));
    };

    /**
     * don't even dare! They'll update you first
     */
    public updateChildren = (req: Request, res: Response) => {
        const { address, children } = req.body;
        UserService.setChildren(address, children)
            .then(() => res.sendStatus(200))
            .catch((e) => controllerLogAndFail(e, 400, res));
    };

    public device = (req: Request, res: Response) => {
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
            userAddress: (req as any).user.address,
            phone: hashPhone,
            identifier,
            device,
            network: hashNetwork,
            lastLogin: new Date(),
        })
            .then(() => res.sendStatus(200))
            .catch(() => res.sendStatus(400));
    };
}

export default UserController;
