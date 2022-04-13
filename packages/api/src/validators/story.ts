import { celebrate, Joi } from 'celebrate';

class StoryValidator {
    add = celebrate({
        body: Joi.object({
            communityId: Joi.number().optional(), // only v1
            message: Joi.string().optional(),
            mediaId: Joi.number().optional(), // only v1
            storyMediaPath: Joi.string().optional(), // only v2
        }),
    });
}

export default StoryValidator;
