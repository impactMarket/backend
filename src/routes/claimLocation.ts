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
                communityPublicId: Joi.string().required(),
                gps: {
                    latitude: Joi.number().required(),
                    longitude: Joi.number().required(),
                },
            }),
        }),
        async (req: Request, res: Response) => {
            const {
                communityPublicId,
                gps,
            } = req.body;
            res.sendStatus(await ClaimLocationService.add(
                communityPublicId,
                gps,
            ) ? 200 : 404);
        },
    );
};