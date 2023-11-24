import { Joi, celebrate } from 'celebrate';

import { createValidator } from '../utils/queryValidator';
import { defaultSchema } from './defaultSchema';

import config from '~config/index';

const validator = createValidator();

// I wish this comes true https://github.com/hapijs/joi/issues/2864#issuecomment-1322736004

// This should match Joi validations
type AnswerRequestType = {
    lesson: string;
    answers: number[];
};
type StartLessonRequestType = {
    lesson: string;
};
type ListLevelsRequestType = {
    status?: 'available' | 'started' | 'completed';
    category?: string;
    limit?: number;
    offset?: number;
    language?: string;
    client?: number;
};
type RegisterClaimRewardsRequestType = {
    transactionHash: string;
};

const listLessonsSchema = defaultSchema.object<{ id: number }>({
    id: Joi.number().required()
});

const listLessonsValidator = validator.params(listLessonsSchema);

const answer = celebrate({
    body: defaultSchema.object({
        answers: defaultSchema.array().items(Joi.number().required()).required(),
        lesson: Joi.string().required()
    })
});

const startLesson = celebrate({
    body: defaultSchema.object({
        lesson: Joi.string().required()
    })
});

const listLevels = celebrate({
    query: {
        status: Joi.string().optional().valid('available', 'started', 'completed'), // TODO: add .default('available'),
        category: Joi.string().optional(),
        limit: Joi.number().optional().default(config.defaultLimit),
        offset: Joi.number().optional().default(config.defaultOffset),
        language: Joi.string().optional(), // TODO: make required
        client: Joi.number().optional().default(1)
    }
});

const registerClaimRewards = celebrate({
    body: defaultSchema.object({
        transactionHash: Joi.string().required()
    })
});

const createLevel = celebrate({
    body: defaultSchema.object({
        rules: defaultSchema
            .object({
                countries: defaultSchema.array().items(Joi.string().length(2).required()).optional(),
                roles: defaultSchema
                    .array()
                    .items(Joi.string().valid('manager', 'beneficiary', 'ambassador').required())
                    .optional(),
                limitUsers: Joi.number().optional()
            })
            .optional()
    })
});

export {
    answer,
    startLesson,
    listLevels,
    registerClaimRewards,
    createLevel,
    listLessonsValidator,
    AnswerRequestType,
    StartLessonRequestType,
    ListLevelsRequestType,
    RegisterClaimRewardsRequestType
};
