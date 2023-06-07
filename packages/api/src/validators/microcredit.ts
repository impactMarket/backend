import { celebrate, Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';
import { ContainerTypes, createValidator, ValidatedRequestSchema } from '../utils/queryValidator';

const validator = createValidator();

const queryListBorrowersSchema = defaultSchema.object({
    offset: Joi.number().optional().default(0),
    limit: Joi.number().optional().max(20).default(10),
    claimed: Joi.boolean().optional(),
    filter: Joi.string().optional().valid('repaid', 'needHelp'),
    orderBy: Joi.string().optional().valid('amount', 'period', 'lastRepayment', 'lastDebt'),
    orderDirection: Joi.string().optional().valid('desc', 'asc')
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

const queryGetBorrowerSchema = defaultSchema.object<{ address: string }>({
    address: Joi.string().required()
});

interface ListBorrowersRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: {
        offset?: number;
        limit?: number;
        claimed?: boolean;
        filter?: 'repaid' | 'needHelp';
        orderBy?: 'amount' | 'period' | 'lastRepayment' | 'lastDebt';
        orderDirection?: 'desc' | 'asc';
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

interface PreSignerUrlFromAWSRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: {
        mime: string;
    };
}

interface GetBorrowerRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: {
        address: string;
    };
}

// I wish this comes true https://github.com/hapijs/joi/issues/2864#issuecomment-1322736004

// This should match Joi validations
type PostDocsRequestType = [
    {
        filepath: string;
        category: number;
    }
];

const listBorrowersValidator = validator.query(queryListBorrowersSchema);
const repaymentsHistoryValidator = validator.query(queryRepaymentsHistorySchema);
const preSignerUrlFromAWSValidator = validator.query(queryPreSignerUrlFromAWSSchema);
const queryGetBorrowerValidator = validator.query(queryGetBorrowerSchema);
const postDocsValidator = celebrate({
    body: defaultSchema
        .array<PostDocsRequestType>()
        .items(
            Joi.object({
                filepath: Joi.string().required(),
                category: Joi.number().required()
            }).required()
        )
        .required()
});

export {
    listBorrowersValidator,
    preSignerUrlFromAWSValidator,
    repaymentsHistoryValidator,
    queryGetBorrowerValidator,
    postDocsValidator,
    ListBorrowersRequestSchema,
    PreSignerUrlFromAWSRequestSchema,
    RepaymentHistoryRequestSchema,
    GetBorrowerRequestSchema,
    PostDocsRequestType
};
