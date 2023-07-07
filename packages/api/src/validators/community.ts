import { Joi, celebrate } from 'celebrate';

import { defaultSchema } from './defaultSchema';

const create = celebrate({
    body: defaultSchema.object({
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
            longitude: Joi.number().required()
        }).required(),
        email: Joi.string().required(),
        coverMediaPath: Joi.string().optional(),
        placeId: Joi.string().optional(),
        txReceipt: Joi.when('contractAddress', {
            not: undefined,
            then: Joi.object().required(),
            otherwise: Joi.object().optional()
        }),
        contractParams: Joi.object().required()
    })
});

const edit = celebrate({
    body: defaultSchema.object({
        name: Joi.string().optional(),
        description: Joi.string().optional(),
        language: Joi.string().optional(), // TODO: to remove
        currency: Joi.string().optional(),
        city: Joi.string().optional(), // TODO: to remove
        country: Joi.string().optional(), // TODO: to remove
        email: Joi.string().optional(), // TODO: to remove
        coverMediaPath: Joi.string().optional()
    })
});

const editSubmission = celebrate({
    body: defaultSchema.object({
        name: Joi.string().optional(),
        description: Joi.string().optional(),
        language: Joi.string().optional(),
        currency: Joi.string().optional(),
        city: Joi.string().optional(),
        country: Joi.string().optional(),
        gps: Joi.object({
            latitude: Joi.number().required(),
            longitude: Joi.number().required()
        }).optional(),
        email: Joi.string().optional(),
        coverMediaPath: Joi.string().optional(),
        placeId: Joi.string().optional(),
        contractParams: Joi.object().optional()
    })
});

const review = celebrate({
    body: defaultSchema.object({
        review: Joi.string().required().valid('pending', 'claimed', 'declined', 'accepted')
    })
});

export default {
    create,
    edit,
    editSubmission,
    review
};
