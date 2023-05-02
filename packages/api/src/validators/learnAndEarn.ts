import { celebrate, Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';

// I wish this comes true https://github.com/hapijs/joi/issues/2864#issuecomment-1322736004

// This should match Joi validations
export type AnswerRequestType = {
    lesson: number;
    answers: number[];
};
export type StartLessonRequestType = {
    lesson: string;
};
export type ListLevelsRequestType = {
    status: string;
    category: string;
    level: string;
    limit?: string;
    offset?: string;
    language?: string;
};
export type RegisterClaimRewardsRequestType = {
    transactionHash: string;
};

class LearnAndEarnValidator {
    answer = celebrate({
        body: defaultSchema.object({
            answers: defaultSchema
                .array()
                .items(Joi.number().required())
                .required(),
            lesson: Joi.number().required(),
        }),
    });

    startLesson = celebrate({
        body: defaultSchema.object({
            lesson: Joi.string().required(),
        }),
    });

    listLevels = celebrate({
        query: {
            status: Joi.string()
                .optional()
                .valid('available', 'started', 'completed'),
            category: Joi.string().optional(),
            level: Joi.string().optional(),
            language: Joi.string().optional(),
        },
    });

    registerClaimRewards = celebrate({
        body: defaultSchema.object({
            transactionHash: Joi.string().required(),
        }),
    });
}

export default LearnAndEarnValidator;
