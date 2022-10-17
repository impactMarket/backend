import { Joi } from 'celebrate';

export const defaultSchema = Joi.defaults((schema) => {
    return schema.options({ abortEarly: false });
});
