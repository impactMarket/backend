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
                amount: Joi.number().required(),
            }),
        }),
        async (req, res) => {
            res.json(await ExperimentalService.counterAdd('totalraised', req.body.amount))
        });

    route.get('/',
        async (req, res) => {
            res.json(await ExperimentalService.counterGet('totalraised'))
        });
};