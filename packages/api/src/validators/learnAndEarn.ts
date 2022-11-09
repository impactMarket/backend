import { celebrate, Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';

class LearnAndEarnValidator {
    answer = celebrate({
        body: defaultSchema.object({
            answers: defaultSchema
                .array()
                .items(Joi.number().required())
                .required(),
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
}

export default LearnAndEarnValidator;
