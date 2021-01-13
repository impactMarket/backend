import { celebrate, Joi } from 'celebrate';

const add = celebrate({
    body: Joi.object({
        communityId: Joi.string().optional(),
        gps: {
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
        },
    }),
});

export default {
    add,
}