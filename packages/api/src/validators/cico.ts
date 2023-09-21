import { Joi } from 'celebrate';

import { ContainerTypes, ValidatedRequestSchema, createValidator } from '../utils/queryValidator';
import { defaultSchema } from './defaultSchema';

const validator = createValidator();

type ListCICOProviderType = {
    country?: string;
    lat?: number;
    lng?: number;
    distance?: number;
};

const queryListBorrowersSchema = defaultSchema.object<ListCICOProviderType>({
    country: Joi.string().optional(),
    lat: Joi.number().optional(),
    lng: Joi.number().optional(),
    distance: Joi.number().optional()
});

interface ListCICOProviderRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: ListCICOProviderType;
}

const listCICOProviderValidator = validator.query(queryListBorrowersSchema);

export { listCICOProviderValidator, ListCICOProviderRequestSchema };
