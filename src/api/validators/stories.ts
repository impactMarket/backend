import { celebrate, Joi } from 'celebrate';

const add = celebrate({
    body: Joi.object({
        communityId: Joi.number().optional(),
        media: Joi.string().optional(),
        message: Joi.string().optional(),
    }),
});

const love = celebrate({
    body: Joi.object({
        contentId: Joi.number().required(),
    }),
});

export default {
    add,
    love,
};
