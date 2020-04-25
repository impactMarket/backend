import { Router, Request, Response, NextFunction } from 'express';
import CommunityService from '../services/community';
import { celebrate, Joi } from 'celebrate';

const route = Router();


export default (app: Router) => {
    app.use('/community', route);

    route.get(
        '/:publicId',
        async (req: Request, res: Response, next: NextFunction) => {
            res.send(await CommunityService.findById(req.params.publicId));
        },
    );

    route.get(
        '/all/:status',
        async (req: Request, res: Response, next: NextFunction) => {
            if (req.params.status === undefined) {
                res.send(await CommunityService.getAll());
            } else {
                res.send(await CommunityService.getAll(req.params.status));
            }
        },
    );

    route.post(
        '/add',
        celebrate({
            body: Joi.object({
                walletAddress: Joi.string().required(),
                name: Joi.string().required(),
                description: Joi.string().required(),
                location: {
                    title: Joi.string().required(),
                    latitude: Joi.number().required(),
                    longitude: Joi.number().required(),
                },
                coverImage: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const {
                walletAddress,
                name,
                description,
                location,
                coverImage,
            } = req.body;
            await CommunityService.add(
                walletAddress,
                name,
                description,
                location,
                coverImage,
                'pending'
            );
            res.sendStatus(200);
        },
    );

    route.post(
        '/accept',
        celebrate({
            body: Joi.object({
                publicId: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const {
                publicId,
            } = req.body;
            await CommunityService.accept(
                publicId,
            );
            // TODO: send transaction to chain!
            res.sendStatus(200);
        },
    );
};