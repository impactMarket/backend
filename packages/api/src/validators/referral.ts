import { Joi, celebrate } from 'celebrate';

import { defaultSchema } from './defaultSchema';

export type ReferralRequestType = {
    code: string;
};

export const referralPostValidator = celebrate({
    body: defaultSchema.object<ReferralRequestType>({
        code: Joi.string().required()
    })
});
