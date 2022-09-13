import { celebrate, Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';

class LearnAndEarnValidator {
    answer = celebrate({
        body: defaultSchema.object({
            answers: defaultSchema
                .array()
                .items(Joi.string().required())
                .required(),
        }),
    });

    startLesson = celebrate({
        body: defaultSchema.object({
            lesson: Joi.number().required(),
        }),
    });
}

export default LearnAndEarnValidator;
