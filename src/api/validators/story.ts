import { celebrate, Joi } from 'celebrate';

class StoryValidator {
    add = celebrate({
        body: Joi.object({
            communityId: Joi.number().optional(),
            message: Joi.string().optional(),
            mediaUrl: Joi.string().optional(),
        }),
    });
}

export default StoryValidator;
