import { celebrate, Joi } from 'celebrate';

const add = celebrate({
    body: Joi.object({
        requestByAddress: Joi.string().required(),
        name: Joi.string().required(),
        contractAddress: Joi.string().optional(),
        description: Joi.string().required(),
        language: Joi.string().required(),
        currency: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        gps: Joi.object({
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
        }).required(),
        email: Joi.string().required(),
        coverMediaId: Joi.string().required(),
        logo: Joi.string().optional(),
        txReceipt: Joi.when('contractAddress', {
            not: undefined,
            then: Joi.object().required(),
            otherwise: Joi.object().optional(),
        }),
        contractParams: Joi.object().required(),
    }),
});

const edit = celebrate({
    body: Joi.object({
        // id: Joi.number().required(), // use manager's auth token
        description: Joi.string().required(),
        language: Joi.string().required(),
        currency: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        email: Joi.string().required(),
        coverMediaId: Joi.string().required(),
        logo: Joi.string().optional(),
    }),
});

const accept = celebrate({
    body: Joi.object({
        acceptanceTransaction: Joi.string().required(),
        publicId: Joi.string().required(),
    }),
});

const remove = celebrate({
    body: Joi.object({
        publicId: Joi.string().required(),
    }),
});

export default {
    add,
    edit,
    accept,
    remove,
};
