import { Joi, celebrate } from 'celebrate';

import { createValidator } from '../utils/queryValidator';
import { defaultSchema } from './defaultSchema';

const validator = createValidator();

type ReferralRequestType = {
    code: string;
};

const getReferralCodeSchema = defaultSchema.object<{ cid: number }>({
    cid: Joi.number().required()
});

const getReferralCodeValidator = validator.params(getReferralCodeSchema);

const referralPostValidator = celebrate({
    body: defaultSchema.object<ReferralRequestType>({
        code: Joi.string().required()
    })
});

export { referralPostValidator, getReferralCodeValidator, ReferralRequestType };
