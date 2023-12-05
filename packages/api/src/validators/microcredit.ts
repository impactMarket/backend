import { Joi, celebrate } from 'celebrate';

import { ContainerTypes, ValidatedRequestSchema, createValidator } from '../utils/queryValidator';
import { defaultSchema } from './defaultSchema';

const validator = createValidator();

type ListBorrowersType = {
    search?: string;
    offset?: number;
    limit?: number;
    filter?: 'not-claimed' | 'ontrack' | 'need-help' | 'repaid' | 'urgent' | 'failed-repayment' | 'in-default';
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
    loanManagerAddress?: string;
};

type ListApplicationsType = {
    search?: string;
    offset?: number;
    limit?: number;
    status?: number;
    orderBy?: 'appliedOn' | 'appliedOn:asc' | 'appliedOn:desc';
    loanManagerAddress?: string;
};

const queryListBorrowersSchema = defaultSchema.object<ListBorrowersType>({
    search: Joi.string().optional(),
    offset: Joi.number().optional().default(0),
    limit: Joi.number().optional().max(20).default(10),
    filter: Joi.string()
        .optional()
        .valid('not-claimed', 'ontrack', 'need-help', 'repaid', 'urgent', 'failed-repayment', 'in-default'),
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
        ),
    loanManagerAddress: Joi.string().optional()
});

const queryListApplicationsSchema = defaultSchema.object<ListApplicationsType>({
    search: Joi.string().optional(),
    offset: Joi.number().optional().default(0),
    limit: Joi.number().optional().max(20).default(10),
    status: Joi.number().optional().min(0),
    orderBy: Joi.string().optional().valid('appliedOn', 'appliedOn:asc', 'appliedOn:desc'),
    loanManagerAddress: Joi.string().optional()
});

const queryRepaymentsHistorySchema = defaultSchema.object({
    offset: Joi.number().optional().default(0),
    limit: Joi.number().optional().max(20).default(5),
    address: Joi.string().required()
});

const queryPreSignerUrlFromAWSSchema = defaultSchema.object({
    mime: Joi.string().required()
});

const queryGetBorrowerSchema = defaultSchema.object<{ address: string; formId: number; include: string | string[] }>({
    address: Joi.alternatives().conditional('formId', {
        is: Joi.any().valid(null, ''),
        then: Joi.string().required(),
        otherwise: Joi.string().optional()
    }),
    formId: Joi.number().optional(),
    include: Joi.alternatives(Joi.string(), Joi.array<string[]>()).optional().default([])
});

const getFormSchema = defaultSchema.object<{ id: number }>({
    id: Joi.number().required()
});

const listManagersByCountrySchema = defaultSchema.object<{ country: string }>({
    country: Joi.string().length(2).required()
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
        address: string;
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
type PostDocsRequestType = {
    applicationId: number;
    docs: [
        {
            filepath: string;
            category: number;
        }
    ];
};
type PutApplicationsRequestType = [
    {
        applicationId: number;
        repaymentRate: number;
        status: number;
    }
];

const getFormValidator = validator.params(getFormSchema);
const listManagersByCountryValidator = validator.params(listManagersByCountrySchema);
const listBorrowersValidator = validator.query(queryListBorrowersSchema);
const listApplicationsValidator = validator.query(queryListApplicationsSchema);
const repaymentsHistoryValidator = validator.query(queryRepaymentsHistorySchema);
const preSignerUrlFromAWSValidator = validator.query(queryPreSignerUrlFromAWSSchema);
const queryGetBorrowerValidator = validator.query(queryGetBorrowerSchema);
const postDocsValidator = celebrate({
    body: defaultSchema
        .object<PostDocsRequestType>({
            applicationId: Joi.number().required(),
            docs: Joi.array()
                .items(
                    Joi.object({
                        filepath: Joi.string().required(),
                        category: Joi.number().required()
                    })
                )
                .required()
        })
        .required()
});
const putApplicationsValidator = celebrate({
    body: defaultSchema
        .array<PutApplicationsRequestType>()
        .items(
            Joi.object({
                applicationId: Joi.number().required(),
                repaymentRate: Joi.number().optional(),
                status: Joi.number().optional()
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
    getFormValidator,
    listManagersByCountryValidator,
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
