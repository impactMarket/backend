import { Joi, celebrate } from 'celebrate';

import { ContainerTypes, ValidatedRequestSchema } from '~utils/queryValidator';
import { config } from '@impactmarket/core';
import { defaultSchema } from './defaultSchema';

type GetManagersRequestType = {
    search?: string;
    state?: 0 | 1;
    orderBy?: string;
    limit?: number;
    offset?: number;
};

type GetBeneficiariesRequestType = {
    limit?: number;
    offset?: number;
    state?: 0 | 1 | 2;
    search?: string;
    orderBy?: string;
    lastActivity_lt?: number;
    suspect?: boolean;
    inactivity?: boolean;
    unidentified?: boolean;
    loginInactivity?: boolean;
};

interface GetManagersRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: GetManagersRequestType;
}

interface GetBeneficiariesRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: GetBeneficiariesRequestType;
}

const getCommunitySchema = defaultSchema.object<{ id: number; query: any }>({
    id: Joi.number().required(),
    query: Joi.any() // validation on getCommunityQuerySchema
});
const getCommunityQuerySchema = defaultSchema.object<{
    limit: number;
    offset: number;
    state: number;
    search: string;
    orderBy: string;
}>({
    limit: Joi.number().optional().default(config.defaultLimit),
    offset: Joi.number().optional().default(config.defaultOffset),
    state: Joi.number().optional().valid(0, 1),
    search: Joi.string().optional(),
    orderBy: Joi.string()
        .optional()
        .valid(
            'state',
            'state:asc',
            'state:desc',
            'added',
            'added:asc',
            'added:desc',
            'removed',
            'removed:asc',
            'removed:desc',
            'since',
            'since:asc',
            'since:desc',
            'until',
            'until:asc',
            'until:desc'
        )
});

const getBeneficiariesQuerySchema = defaultSchema.object<{
    limit: number;
    offset: number;
    state: number;
    search: string;
    orderBy: string;
    lastActivity_lt: number;
    suspect: boolean;
    inactivity: boolean;
    unidentified: boolean;
    loginInactivity: boolean;
}>({
    limit: Joi.number().optional().default(config.defaultLimit),
    offset: Joi.number().optional().default(config.defaultOffset),
    state: Joi.number().optional().valid(0, 1, 2),
    search: Joi.string().optional(),
    orderBy: Joi.string()
        .optional()
        .valid(
            'state',
            'state:asc',
            'state:desc',
            'claimed',
            'claimed:asc',
            'claimed:desc',
            'since',
            'since:asc',
            'since:desc'
        ),
    lastActivity_lt: Joi.number().optional(),
    suspect: Joi.boolean().optional(),
    inactivity: Joi.boolean().optional(),
    unidentified: Joi.boolean().optional(),
    loginInactivity: Joi.boolean().optional()
});

const getCommunityByIDOrAddressQuerySchema = defaultSchema.object<{ state: string }>({
    state: Joi.string().optional().valid('ubi', 'base')
});

const getCommunityByIDOrAddressSchema = defaultSchema.object<{ idOrAddress: number | string; query: any }>({
    idOrAddress: Joi.alternatives(
        Joi.number(),
        Joi.string()
            .messages({
                startWith: 'An address should start with 0x'
            })
            .custom((value, helpers) => {
                if (!value.startsWith('0x')) {
                    return helpers.error('startWith');
                }
                return value;
            })
    ),
    query: Joi.any() // validation on getCommunityByIDOrAddressQuerySchema
});

const getCommunityValidator = celebrate({
    params: getCommunitySchema,
    query: getCommunityQuerySchema
});
const getBeneficiariesValidator = celebrate({
    params: getCommunitySchema,
    query: getBeneficiariesQuerySchema
});
const getCommunityByIDOrAddressValidator = celebrate({
    params: getCommunityByIDOrAddressSchema,
    query: getCommunityByIDOrAddressQuerySchema
});

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

export {
    create,
    edit,
    editSubmission,
    review,
    getCommunityValidator,
    getCommunityByIDOrAddressValidator,
    getBeneficiariesValidator,
    GetManagersRequestType,
    GetManagersRequestSchema,
    GetBeneficiariesRequestSchema
};
