import { celebrate, Joi } from 'celebrate';

class StoryValidator {
    add = celebrate({
        body: Joi.object({
            communityId: Joi.number(),
            message: Joi.string().optional(),
            mediaId: Joi.number().optional(),
        }),
    });
}

export default StoryValidator;
