import { Joi, celebrate } from 'celebrate';

import { defaultSchema } from './defaultSchema';

const add = celebrate({
    body: defaultSchema.object({
        communityId: Joi.any().required(), // TODO: should be a number. To replace soon
        gps: {
            latitude: Joi.number().required(),
            longitude: Joi.number().required()
        }
    })
});

export default {
    add
};
