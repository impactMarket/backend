import { Router, Request, Response, NextFunction } from 'express';
import CommunityService from '../services/community';
import { celebrate, Joi } from 'celebrate';

const route = Router();


export default (app: Router) => {
    app.use('/community', route);

    route.get(
        '/address/:contractAddress',
        async (req: Request, res: Response, next: NextFunction) => {
            const result = await CommunityService.findByContractAddress(req.params.contractAddress);
            console.log(result, req.params);
            res.send(result);
        },
    );

    route.get(
        '/id/:publicId',
        async (req: Request, res: Response, next: NextFunction) => {
            res.send(await CommunityService.findByPublicId(req.params.publicId));
        },
    );

    route.get(
        '/all/:status?',
        async (req: Request, res: Response, next: NextFunction) => {
            res.send(await CommunityService.getAll(req.params.status));
        },
    );

    route.post(
        '/request',
        celebrate({
            body: Joi.object({
                requestByAddress: Joi.string().required(),
                name: Joi.string().required(),
                description: Joi.string().required(),
                location: {
                    title: Joi.string().required(),
                    latitude: Joi.number().required(),
                    longitude: Joi.number().required(),
                },
                coverImage: Joi.string().required(),
                txCreationObj: Joi.object().required(),
            }),
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const {
                requestByAddress, // the address making the request (will be community coordinator)
                name,
                description,
                location,
                coverImage,
                txCreationObj,
            } = req.body;
            await CommunityService.request(
                requestByAddress,
                name,
                description,
                location,
                coverImage,
                txCreationObj,
            );
            res.sendStatus(200);
        },
    );

    route.post(
        '/accept',
        celebrate({
            body: Joi.object({
                acceptanceTransaction: Joi.string().required(),
                publicId: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const {
                acceptanceTransaction, // the address accepting the request (must be admin)
                publicId,
            } = req.body;
            const accpeted: boolean = await CommunityService.accept(
                acceptanceTransaction,
                publicId,
            );
            res.sendStatus(accpeted ? 200 : 503);
        },
    );
};