import { celebrate, Joi } from 'celebrate';

const create = celebrate({
    body: Joi.object({
        requestByAddress: Joi.string().required(),
        name: Joi.string().required(),
        contractAddress: Joi.string().optional(),
        description: Joi.string().required(),
        language: Joi.string().required(),
        currency: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        gps: {
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
        },
        email: Joi.string().required(),
        coverImage: Joi.string().required(),
        txReceipt: Joi.when('contractAddress', {
            not: undefined,
            then: Joi.object().required()
        }),
        contractParams: Joi.object().required(),
    }),
});

const edit = celebrate({
    body: Joi.object({
        publicId: Joi.string().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        language: Joi.string().required(),
        currency: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        email: Joi.string().required(),
        coverImage: Joi.string().required(),
    }),
});

const accept = celebrate({
    body: Joi.object({
        acceptanceTransaction: Joi.string().required(),
        publicId: Joi.string().required(),
    }),
});

export default {
    create,
    edit,
    accept
}