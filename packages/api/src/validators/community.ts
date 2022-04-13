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
        gps: Joi.object({
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
        }).required(),
        email: Joi.string().required(),
        coverMediaId: Joi.number().required(),
        txReceipt: Joi.when('contractAddress', {
            not: undefined,
            then: Joi.object().required(),
            otherwise: Joi.object().optional(),
        }),
        contractParams: Joi.object().required(),
    }),
});

/**
 * @deprecated
 */
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
        name: Joi.string().required(),
        description: Joi.string().required(),
        language: Joi.string().optional(), // TODO: to remove
        currency: Joi.string().required(),
        city: Joi.string().optional(), // TODO: to remove
        country: Joi.string().optional(), // TODO: to remove
        email: Joi.string().optional(), // TODO: to remove
        coverMediaId: Joi.number().required(),
    }),
});

const editSubmission = celebrate({
    body: Joi.object({
        name: Joi.string().required(),
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
        coverMediaId: Joi.number().optional(), // only v1
        coverMediaPath: Joi.string().optional(), // only v2
        contractParams: Joi.object().optional(),
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

const review = celebrate({
    body: Joi.object({
        review: Joi.string().required().valid('declined', 'claimed'),
    }),
});

export default {
    add,
    create,
    edit,
    editSubmission,
    accept,
    remove,
    review,
};
