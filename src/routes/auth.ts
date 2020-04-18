import { Router, Request, Response, NextFunction } from 'express';
// import AuthService from '../../services/auth';
// import { IUserInputDTO } from '../../interfaces/IUser';
// import middlewares from '../middlewares';
import { celebrate, Joi } from 'celebrate';

const route = Router();

export default (app: Router) => {
    app.use('/auth', route);

    route.post(
        '/signup',
        celebrate({
            body: Joi.object({
                name: Joi.string().required(),
                email: Joi.string().required(),
                password: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            //
        },
    );
};