import { Router, Request, Response, NextFunction } from 'express';
import CommunityService from '../services/community';
import { celebrate, Joi } from 'celebrate';

const route = Router();


export default (app: Router) => {
    app.use('/community', route);

    route.get(
        '/:walletAddress',
        async (req: Request, res: Response, next: NextFunction) => {
            res.send(await CommunityService.get(req.params.walletAddress));
        },
    );

    route.get(
        '/',
        async (req: Request, res: Response, next: NextFunction) => {
            res.send(await CommunityService.getAll());
        },
    );

    route.post(
        '/add',
        celebrate({
            body: Joi.object({
                walletAddress: Joi.string().required(),
                name: Joi.string().required()
            }),
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const { walletAddress, name } = req.body;
            await CommunityService.add(walletAddress, name);
            res.sendStatus(200);
        },
    );
};