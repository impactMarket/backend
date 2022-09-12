import { celebrate, Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';

class LearnAndEarnValidator {
    answer = celebrate({
        body: defaultSchema.object({
            answers: defaultSchema
                .array()
                .items(
                    defaultSchema
                        .object({
                            quiz: Joi.string().required(),
                            answer: Joi.string().required(),
                        })
                        .required()
                )
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
