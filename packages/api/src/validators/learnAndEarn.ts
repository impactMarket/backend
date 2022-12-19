import { celebrate, Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';

// I wish this comes true https://github.com/hapijs/joi/issues/2864#issuecomment-1322736004

// This should match Joi validations
export type RegisterClaimRewardsRequestType = {
    level: number;
    transactionHash: string;
}[];

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
            lesson: Joi.number().required(),
        }),
    });

    listLevels = celebrate({
        query: {
            status: Joi.string()
                .optional()
                .valid('available', 'started', 'completed'),
            category: Joi.string().optional(),
            level: Joi.string().optional(),
        },
    });

    registerClaimRewards = celebrate({
        body: defaultSchema
            .array()
            .items(
                Joi.object({
                    level: Joi.number().required(),
                    transactionHash: Joi.string().required(),
                }).required()
            )
            .required(),
    });
}

export default LearnAndEarnValidator;
