import {
    Router,
} from 'express';
import ExperimentalService from '../services/experimental';
import { celebrate, Joi } from 'celebrate';

const route = Router();


export default (app: Router): void => {
    app.use('/experimental', route);

    route.post('/',
        celebrate({
            body: Joi.object({
                db: Joi.string().required(),
                amount: Joi.number().required(),
            }),
        }),
        async (req, res) => {
            await ExperimentalService.counterAdd(req.body.db, req.body.amount);
            res.send(200);
        });

    route.get('/',
        (req, res) => {
            res.send(ExperimentalService.get())
        });
};