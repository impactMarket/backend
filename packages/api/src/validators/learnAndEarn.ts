import { celebrate, Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';

class LearnAndEarnValidator {
    add = celebrate({
        body: defaultSchema.object({
            message: Joi.string().optional(),
            storyMedia: Joi.array().items(Joi.string()).optional(),
        }),
    });
}

export default LearnAndEarnValidator;
