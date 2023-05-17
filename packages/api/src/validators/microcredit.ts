import { Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';
import { ContainerTypes, createValidator, ValidatedRequestSchema } from '../utils/queryValidator';

const validator = createValidator();

const queryListBorrowersSchema = defaultSchema.object({
    offset: Joi.number().optional().default(0),
    limit: Joi.number().optional().max(20).default(10)
});

const queryRepaymentsHistorySchema = defaultSchema.object({
    offset: Joi.number().optional().default(0),
    limit: Joi.number().optional().max(20).default(5),
    loanId: Joi.number().required(),
    borrower: Joi.string().required()
});

const queryPreSignerUrlFromAWSSchema = defaultSchema.object({
    mime: Joi.string().required()
});

interface ListBorrowersRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: {
        offset?: number;
        limit?: number;
    };
}
interface PreSignerUrlFromAWSRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: {
        mime: string;
    };
}

interface RepaymentHistoryRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: {
        offset?: number;
        limit?: number;
        loanId: number;
        borrower: string;
    };
}

const listBorrowersValidator = validator.query(queryListBorrowersSchema);
const repaymentsHistoryValidator = validator.query(queryRepaymentsHistorySchema);
const preSignerUrlFromAWSValidator = validator.query(queryPreSignerUrlFromAWSSchema);

export {
    listBorrowersValidator,
    preSignerUrlFromAWSValidator,
    repaymentsHistoryValidator,
    ListBorrowersRequestSchema,
    PreSignerUrlFromAWSRequestSchema,
    RepaymentHistoryRequestSchema
};
