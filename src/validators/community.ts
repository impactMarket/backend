import { celebrate, Joi } from 'celebrate';
import { Request, Response, NextFunction } from 'express';

const split = (req: Request, res: Response, next: NextFunction) => {
    

    const { name } = req.body;

    req.body = {
        name
    }

    next();
}

const create = celebrate({
// body: Joi.object({
//     // requestByAddress: Joi.string().required(),
//     name: Joi.string().required(),
//     // contractAddress: Joi.string().required(),
//     description: Joi.string().required(),
//     // language: Joi.string(), // TODO: make required
//     // currency: Joi.string(), // TODO: make required
//     // city: Joi.string().required(),
//     // country: Joi.string().required(),
//     // gps: {
//     //     latitude: Joi.number().required(),
//     //     longitude: Joi.number().required(),
//     // },
//     // email: Joi.string().required(),
//     // coverImage: Joi.string().required(),
//     // txReceipt: Joi.object().required(),
//     // contractParams: Joi.object().optional(), // TODO: make required
//     // txCreationObj: Joi.object().optional(), // TODO: remove
// }),
    body: {
        //
        name: Joi.string().required(),
    }
});

export default {
    split,
    create
}