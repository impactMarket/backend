import { celebrate, Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';

class StoryValidator {
    add = celebrate({
        body: defaultSchema.object({
            message: Joi.string().optional(),
            storyMedia: Joi.array().items(Joi.string()).optional(),
        }),
    });

    addComment = celebrate({
        body: defaultSchema.object({
            comment: Joi.string().required(),
        }),
    });
}

export default StoryValidator;
