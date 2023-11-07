import { Joi, celebrate } from 'celebrate';

import { defaultSchema } from './defaultSchema';

class SavingCirclelidator {
    create = celebrate({
        body: defaultSchema.object({
            name: Joi.string().required(),
            country: Joi.string().length(2).required(),
            amount: Joi.number().required(),
            frequency: Joi.number().required(),
            firstDepositOn: Joi.number().required(),
            members: Joi.array().items(Joi.string()).min(2).required()
        })
    });
}

export default SavingCirclelidator;
