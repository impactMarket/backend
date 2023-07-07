import { Joi, celebrate } from 'celebrate';

// I wish this comes true https://github.com/hapijs/joi/issues/2864#issuecomment-1322736004

// This should match Joi validations
export type AttestationRequestType = {
    plainTextIdentifier: string;
    type: number;
    code?: string;
    service: 'verify' | 'send';
};

export const attestationValidator = celebrate({
    body: Joi.object({
        plainTextIdentifier: Joi.string().required(),
        type: Joi.number().required(),
        code: Joi.when('service', {
            is: 'verify',
            then: Joi.string().required()
        }),
        service: Joi.string().required().valid('verify', 'send')
    })
});
