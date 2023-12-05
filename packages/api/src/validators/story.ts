import { Joi, celebrate } from 'celebrate';

import { ContainerTypes, ValidatedRequestSchema, createValidator } from '../utils/queryValidator';
import { defaultSchema } from './defaultSchema';
import config from '~config/index';

const validator = createValidator();

type GetStoryCommentsRequestType = {
    limit?: number;
    offset?: number;
};

interface GetStoryCommentsRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: GetStoryCommentsRequestType;
}

const getStorySchema = defaultSchema.object<{ id: number; query: any }>({
    id: Joi.number().required(),
    query: Joi.any() // validation on getStoryQuerySchema
});

const getStoryQuerySchema = defaultSchema.object<{ limit: number; offset: number }>({
    limit: Joi.number().optional().default(config.defaultLimit),
    offset: Joi.number().optional().default(config.defaultOffset)
});

const getStoryValidator = validator.params(getStorySchema);
const getStoryCommentsValidator = celebrate({
    params: getStorySchema,
    query: getStoryQuerySchema
});

const add = celebrate({
    body: defaultSchema.object({
        message: Joi.string().optional(),
        storyMedia: Joi.array().items(Joi.string()).optional()
    })
});

const addComment = celebrate({
    body: defaultSchema.object({
        comment: Joi.string().required()
    })
});

export { getStoryValidator, getStoryCommentsValidator, add, addComment, GetStoryCommentsRequestSchema };
