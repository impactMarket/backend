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
import { authenticateToken } from '../../middlewares';


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
                gps: {
                    latitude: Joi.number().required(),
                    longitude: Joi.number().required(),
                },
            }),
        }),
        async (req: Request, res: Response) => {
            const {
                gps,
            } = req.body;
            res.sendStatus(await ClaimLocationService.add(
                gps
            ) ? 200 : 404);
        },
    );
};