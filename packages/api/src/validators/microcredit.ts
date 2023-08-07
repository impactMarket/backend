import { Joi, celebrate } from 'celebrate';

import { ContainerTypes, ValidatedRequestSchema, createValidator } from '../utils/queryValidator';
import { defaultSchema } from './defaultSchema';

const validator = createValidator();

type ListBorrowersType = {
    offset?: number;
    limit?: number;
    filter?: 'not-claimed' | 'ontrack' | 'need-help' | 'repaid';
    orderBy?:
        | 'amount'
        | 'amount:asc'
        | 'amount:desc'
        | 'period'
        | 'period:asc'
        | 'period:desc'
        | 'lastRepayment'
        | 'lastRepayment:asc'
        | 'lastRepayment:desc'
        | 'lastDebt'
        | 'lastDebt:asc'
        | 'lastDebt:desc'
        | 'performance'
        | 'performance:asc'
        | 'performance:desc';
};

type ListApplicationsType = {
    offset?: number;
    limit?: number;
    status?: number;
    orderBy?: 'appliedOn' | 'appliedOn:asc' | 'appliedOn:desc';
};

const queryListBorrowersSchema = defaultSchema.object<ListBorrowersType>({
    offset: Joi.number().optional().default(0),
    limit: Joi.number().optional().max(20).default(10),
    filter: Joi.string().optional().valid('not-claimed', 'ontrack', 'need-help', 'repaid'),
    orderBy: Joi.string()
        .optional()
        .valid(
            'amount',
            'amount:asc',
            'amount:desc',
            'period',
            'period:asc',
            'period:desc',
            'lastRepayment',
            'lastRepayment:asc',
            'lastRepayment:desc',
            'lastDebt',
            'lastDebt:asc',
            'lastDebt:desc',
            'performance',
            'performance:asc',
            'performance:desc'
        )
});

const queryListApplicationsSchema = defaultSchema.object<ListApplicationsType>({
    offset: Joi.number().optional().default(0),
    limit: Joi.number().optional().max(20).default(10),
    status: Joi.number().optional().min(0).max(5),
    orderBy: Joi.string().optional().valid('appliedOn', 'appliedOn:asc', 'appliedOn:desc')
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

const queryGetBorrowerSchema = defaultSchema.object<{ address: string; formId: number; include: string | string[] }>({
    address: Joi.alternatives().conditional('formId', {
        is: Joi.any().valid(null, ""),
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),
    formId: Joi.number().optional(),
    include: Joi.alternatives(Joi.string(), Joi.array<string[]>()).optional().default([])
});

interface ListBorrowersRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: ListBorrowersType;
}

interface ListApplicationsRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Query]: ListApplicationsType;
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
        include: string | string[];
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
type PutApplicationsRequestType = [
    {
        applicationId: number;
        status: number;
    }
];

const listBorrowersValidator = validator.query(queryListBorrowersSchema);
const listApplicationsValidator = validator.query(queryListApplicationsSchema);
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
const putApplicationsValidator = celebrate({
    body: defaultSchema
        .array<PutApplicationsRequestType>()
        .items(
            Joi.object({
                applicationId: Joi.number().required(),
                status: Joi.number().required()
            }).required()
        )
        .required()
});
const saveForm = celebrate({
    body: defaultSchema
        .object({
            prismicId: Joi.string().required(),
            form: Joi.object().optional(),
            selectedLoanManagerId: Joi.number().optional(),
            submit: Joi.bool().optional()
        })
        .or('selectedLoanManagerId', 'form')
        .required()
});
const addNote = celebrate({
    body: defaultSchema
        .object({
            userId: Joi.number().required(),
            note: Joi.string().required()
        })
        .required()
});

export {
    listBorrowersValidator,
    listApplicationsValidator,
    preSignerUrlFromAWSValidator,
    repaymentsHistoryValidator,
    queryGetBorrowerValidator,
    postDocsValidator,
    putApplicationsValidator,
    saveForm,
    addNote,
    ListBorrowersRequestSchema,
    ListApplicationsRequestSchema,
    PreSignerUrlFromAWSRequestSchema,
    RepaymentHistoryRequestSchema,
    GetBorrowerRequestSchema,
    PostDocsRequestType,
    PutApplicationsRequestType
};
