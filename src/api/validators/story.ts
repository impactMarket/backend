import { celebrate, Joi } from 'celebrate';

class StoryValidator {
    add = celebrate({
        body: Joi.object({
            byAddress: Joi.string().required(),
            communityId: Joi.number().optional(),
            // media: Joi.string().optional(),
            message: Joi.string().optional(),
        }),
    });

    remove = celebrate({
        body: Joi.object({
            contentId: Joi.number().required(),
        }),
    });

    love = celebrate({
        body: Joi.object({
            contentId: Joi.number().required(),
        }),
    });
}

export default StoryValidator;
