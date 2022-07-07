import { celebrate, Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';

class StoryValidator {
    add = celebrate({
        body: defaultSchema.object({
            communityId: Joi.number().optional(), // only v1
            message: Joi.string().optional(),
            mediaId: Joi.number().optional(), // only v1
            storyMediaPath: Joi.string().optional(), // TODO: remove
            storyMedia: Joi.array().items(Joi.string()).optional(), // only v2
        }),
    });

    addComment = celebrate({
        body: defaultSchema.object({
            comment: Joi.string().required(),
        }),
    });
}

export default StoryValidator;
