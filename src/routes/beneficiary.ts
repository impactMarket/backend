import { Router, Request, Response, NextFunction } from 'express';
import BeneficiaryService from '../services/beneficiary';
import { celebrate, Joi } from 'celebrate';

const route = Router();


export default (app: Router) => {
    app.use('/beneficiary', route);

    route.get(
        '/:publicId',
        async (req: Request, res: Response, next: NextFunction) => {
            res.send(await BeneficiaryService.findByCommunityId(req.params.publicId));
        },
    );

    route.post(
        '/request',
        celebrate({
            body: Joi.object({
                walletAddress: Joi.string().required(),
                communityPublicId: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const {
                walletAddress,
                communityPublicId,
            } = req.body;
            await BeneficiaryService.request(
                walletAddress,
                communityPublicId,
            );
            res.sendStatus(200);
        },
    );

    route.post(
        '/accept',
        celebrate({
            body: Joi.object({
                acceptanceTransaction: Joi.string().required(),
                communityPublicId: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const {
                acceptanceTransaction,
                communityPublicId,
            } = req.body;
            await BeneficiaryService.accept(
                acceptanceTransaction,
                communityPublicId,
            );
            res.sendStatus(200);
        },
    );

};