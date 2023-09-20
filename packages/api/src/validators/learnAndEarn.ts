import { Joi, celebrate } from 'celebrate';

import { defaultSchema } from './defaultSchema';

// I wish this comes true https://github.com/hapijs/joi/issues/2864#issuecomment-1322736004

// This should match Joi validations
export type AnswerRequestType = {
    lesson: string;
    answers: number[];
};
export type StartLessonRequestType = {
    lesson: string;
};
export type ListLevelsRequestType = {
    status?: 'available' | 'started' | 'completed';
    category?: string;
    limit?: string;
    offset?: string;
    language?: string;
    client?: number;
};
export type RegisterClaimRewardsRequestType = {
    transactionHash: string;
};

class LearnAndEarnValidator {
    answer = celebrate({
        body: defaultSchema.object({
            answers: defaultSchema.array().items(Joi.number().required()).required(),
            lesson: Joi.string().required()
        })
    });

    startLesson = celebrate({
        body: defaultSchema.object({
            lesson: Joi.string().required()
        })
    });

    listLevels = celebrate({
        query: {
            status: Joi.string().optional().valid('available', 'started', 'completed'), // TODO: add .default('available'),
            category: Joi.string().optional(),
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            language: Joi.string().optional(), // TODO: make required
            client: Joi.number().optional().default(1)
        }
    });

    registerClaimRewards = celebrate({
        body: defaultSchema.object({
            transactionHash: Joi.string().required()
        })
    });

    createLevel = celebrate({
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
}

export default LearnAndEarnValidator;
