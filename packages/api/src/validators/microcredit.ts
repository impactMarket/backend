import { Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';
import {
    ContainerTypes,
    createValidator,
    ValidatedRequestSchema,
} from '../utils/queryValidator';

const validator = createValidator();

const queryListBorrowersSchema = defaultSchema.object({
    offset: Joi.number().optional(),
    limit: Joi.number().optional(),
});

interface ListBorrowersRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: {
        offset?: number;
        limit?: number;
    };
}

const listBorrowersValidator = validator.query(queryListBorrowersSchema);

export { listBorrowersValidator, ListBorrowersRequestSchema };
