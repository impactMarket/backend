import { celebrate, Joi } from 'celebrate';

const add = celebrate({
    body: Joi.object({
        communityId: Joi.any().required(), // TODO: should be a number. To replace soon
        gps: {
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
        },
    }),
});

export default {
    add,
};
