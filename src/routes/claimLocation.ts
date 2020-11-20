import {
    Router,
    Request,
    Response,
} from 'express';
import ClaimLocationService from '../services/claimLocation';
import {
    celebrate,
    Joi
} from 'celebrate';
import { authenticateToken } from '../middlewares';


const route = Router();

export default (app: Router): void => {
    app.use('/claim-location', route);
    route.get(
        '/',
        async (req: Request, res: Response) => {
            res.send(await ClaimLocationService.getAll());
        },
    );

    route.post(
        '/',
        authenticateToken,
        celebrate({
            body: Joi.object({
                communityPublicId: Joi.string().optional(), // TODO: remove
                communityId: Joi.string().optional(),
                gps: {
                    latitude: Joi.number().required(),
                    longitude: Joi.number().required(),
                },
            }),
        }),
        async (req: Request, res: Response) => {
            const {
                communityPublicId, // TODO: remove
                communityId,
                gps,
            } = req.body;
            let _communityId = communityId;
            if (communityId === undefined) {
                _communityId = communityPublicId // TODO: remove
            }
            res.sendStatus(await ClaimLocationService.add(
                _communityId,
                gps,
            ) ? 200 : 404);
        },
    );
};