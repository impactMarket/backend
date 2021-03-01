import { celebrate, Joi } from 'celebrate';

const subscribe = celebrate({
    body: Joi.object({
        email: Joi.string().required(),
    }),
});

export default {
    subscribe,
};
