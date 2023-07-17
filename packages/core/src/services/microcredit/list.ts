import { AppUser } from '../../interfaces/app/appUser';
import { BigNumber, Contract } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { MicrocreditABI as MicroCreditABI } from '../../contracts';
import { MicroCreditApplication, MicroCreditApplicationStatus } from '../../interfaces/microCredit/applications';
import { MicroCreditBorrowers } from '../../interfaces/microCredit/borrowers';
import { Op, Order, WhereOptions, literal } from 'sequelize';
import { config } from '../../..';
import { getAddress } from '@ethersproject/address';
import {
    getBorrowerLoansCount,
    getBorrowers,
    getLoanRepayments,
    getUserLastLoanStatusFromSubgraph
} from '../../subgraph/queries/microcredit';
import { getUserRoles } from '../../subgraph/queries/user';
import { models } from '../../database';
import { utils } from '@impactmarket/core';

// it was ChatGPT who did it, don't ask me to explain!
// jk, here's the prompt to generate this:
// in nodejs, I need a method that merges two arrays using a specific key common to both.
// But with something special. I want to merge them following the array order and sometimes
// I'll want to use the array 1 order and sometimes the array 2 order. There's also another
// important aspect, array 1 and 2 might not have the same items. There might be a case in
// which array 2 does not have some keys that exist in array 1 and vice versa.
// In those cases, the order is also very important. If I want to order by array two,
// then the rule should be to merge only the existing items from array 1 to array 2
// only if they exist in array two and return. Same if done with array 1 order.
function mergeArraysByOrder<T1 extends Record<string, any>, T2 extends Record<string, any>>(
    arr1: T1[],
    arr2: T2[],
    key: keyof T1 & keyof T2,
    useArr1Order: boolean
): (T1 & T2)[] {
    const merged: (T1 & T2)[] = [];

    const getKeyIndex = (array: (T1 | T2)[], value: T1[keyof T1] & T2[keyof T2]): number => {
        for (let i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return i;
            }
        }
        return -1;
    };

    const mergeItems = (item1: T1 | T2, item2: T1 | T2): T1 & T2 => {
        const mergedItem: T1 & T2 = { ...(item2 as T2) } as any;

        for (const prop in item1) {
            if (item1.hasOwnProperty(prop) && !mergedItem.hasOwnProperty(prop)) {
                mergedItem[prop as keyof (T1 & T2)] = item1[prop];
            }
        }

        return mergedItem;
    };

    for (const item of useArr1Order ? arr1 : arr2) {
        const keyIndex = getKeyIndex(useArr1Order ? arr2 : arr1, item[key] as T1[keyof T1] & T2[keyof T2]);
        if (keyIndex !== -1) {
            merged.push(mergeItems(useArr1Order ? item : arr1[keyIndex], useArr1Order ? arr2[keyIndex] : item));
        }
    }

    return merged;
}

export enum LoanStatus {
    NO_LOAN = 0,
    FORM_DRAFT = 1,
    PENDING_REVIEW = 2,
    REQUEST_CHANGES = 3,
    APPROVED = 4,
    REJECTED = 5,
    PENDING_CLAIM = 6,
    CLAIMED = 7,
    FULL_REPAID = 8,
    CANCELED = 9
}

// verify if the user has any pending loan, from microcreditApplications
// and if so, but accepted, fetch the subgraph for status, otherwise, return
async function getLastLoanStatus(user: { id: number; address: string }): Promise<number> {
    // only the most recent
    const form = await models.microCreditApplications.findOne({
        where: {
            userId: user.id
        },
        order: [['createdAt', 'DESC']],
        limit: 1
    });

    if (!form) {
        return LoanStatus.NO_LOAN;
    }

    if (form.status === MicroCreditApplicationStatus.APPROVED) {
        try {
            const status = await getUserLastLoanStatusFromSubgraph(user.address);
            return status + 6;
        } catch (e) {
            return LoanStatus.NO_LOAN;
        }
    }

    switch (form.status) {
        case MicroCreditApplicationStatus.PENDING:
            return LoanStatus.FORM_DRAFT;
        case MicroCreditApplicationStatus.SUBMITTED:
        case MicroCreditApplicationStatus.IN_REVIEW:
            return LoanStatus.PENDING_REVIEW;
        case MicroCreditApplicationStatus.REQUEST_CHANGES:
            return LoanStatus.REQUEST_CHANGES;
        case MicroCreditApplicationStatus.REJECTED:
            return LoanStatus.REJECTED;
        default:
            return LoanStatus.NO_LOAN;
    }
}

export type GetBorrowersQuery = {
    offset?: number;
    limit?: number;
    addedBy?: string;
    filter?: 'all' | 'ontrack' | 'need-help' | 'repaid';
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
        // backend orders only
        | 'performance'
        | 'performance:asc'
        | 'performance:desc';
};

// exclude orderBy from the object to prepare it to be used on the subgraph
function excludeDatabaseQueriesWhenSubgraph(query: GetBorrowersQuery) {
    if (query.orderBy && query.orderBy.indexOf('performance') !== -1) {
        const { orderBy, filter, ...rest } = query;
        return rest;
    }
    return query;
}

export default class MicroCreditList {
    public listBorrowers = async (
        query: GetBorrowersQuery
    ): Promise<{
        count: number;
        rows: {
            address: string;
            firstName: string | null;
            lastName: string | null;
            avatarMediaPath: string | null;
            loan: {
                amount: string;
                period: number;
                dailyInterest: number;
                claimed: number;
                repayed: string;
                lastRepayment: number;
                lastRepaymentAmount: string;
                lastDebt: string;
            };
        }[];
    }> => {
        let usersToFilter: AppUser[] | undefined = undefined;
        let order: Order | undefined;
        let where: WhereOptions<MicroCreditBorrowers> | undefined;
        let count = 0;

        // build up database queries based on query params
        if (query.orderBy && query.orderBy.indexOf('performance') !== -1) {
            order = [[literal('performance'), query.orderBy.indexOf('asc') !== -1 ? 'ASC' : 'DESC']];
        }
        if (query.filter === 'ontrack') {
            where = {
                performance: {
                    [Op.gte]: 100
                }
            };
        } else if (query.filter === 'need-help') {
            where = {
                performance: {
                    [Op.lt]: 100
                }
            };
        }
        if (order || where) {
            // performance is calculated on backend, so we need to get it from the database
            const rBorrowers = await models.microCreditBorrowers.findAndCountAll({
                attributes: ['performance'],
                where: {
                    ...where,
                    manager: query.addedBy
                },
                order,
                limit: order ? query.limit ?? 10 : undefined,
                offset: order ? query.offset ?? 0 : undefined,
                include: [
                    {
                        model: models.appUser,
                        attributes: ['address', 'firstName', 'lastName', 'avatarMediaPath'],
                        as: 'user'
                    }
                ]
            });

            usersToFilter = rBorrowers.rows.map(b => ({ ...b.user!.toJSON(), performance: b.performance }));
            if (where) {
                count = rBorrowers.count;
            }
        }

        let onlyBorrowers: string[] | undefined = undefined;
        if (usersToFilter) {
            // when there's already a list of users but no order, this means, all users were fetched
            // so we need to slice to get only the ones we want
            if (!order) {
                const { offset, limit } = query;
                usersToFilter = usersToFilter.slice(offset ?? 0, limit ?? 10);
            }
            onlyBorrowers = usersToFilter.map(b => b.address);
        }
        // get borrowers loans from subgraph
        // and return only the active loan
        const rawBorrowers = await getBorrowers({
            ...excludeDatabaseQueriesWhenSubgraph(query),
            onlyBorrowers,
            onlyClaimed: true,
            loanStatus: query.filter === 'repaid' ? 2 : query.filter === undefined ? undefined : 1
        });
        if (!where) {
            count = rawBorrowers.count;
        }
        const borrowers = rawBorrowers.borrowers.map(b => ({ address: getAddress(b.id), loan: b.loan }));

        if (!usersToFilter) {
            // get borrowers profile from database
            const userProfile = await models.appUser.findAll({
                attributes: ['address', 'firstName', 'lastName', 'avatarMediaPath'],
                where: {
                    address: borrowers.map(b => b.address)
                },
                include: [
                    {
                        model: models.microCreditBorrowers,
                        attributes: ['performance'],
                        as: 'borrower'
                    }
                ]
            });
            usersToFilter = userProfile.map(u => {
                const user = u.toJSON();
                delete user['borrower'];

                return { ...user, performance: u.borrower?.performance };
            });
        }

        type User = {
            address: string;
            firstName: string | null;
            lastName: string | null;
            avatarMediaPath: string | null;
        };
        // merge borrowers loans and profile
        return {
            count,
            rows: mergeArraysByOrder<any, User>(
                borrowers,
                usersToFilter,
                'address',
                !(query.orderBy && query.orderBy.indexOf('performance') !== -1)
            )
        };
    };

    // read application from models.microCreditApplications, including appUser to include profile
    public listApplications = async (query: {
        offset?: number;
        limit?: number;
        status?: number;
        orderBy?: 'appliedOn' | 'appliedOn:asc' | 'appliedOn:desc';
    }): Promise<{
        count: number;
        rows: {
            // from models.appUser
            address: string;
            firstName: string | null;
            lastName: string | null;
            avatarMediaPath: string | null;
            // from models.microCreditApplications
            application: {
                amount: number;
                period: number;
                appliedOn: Date;
                status: number;
                decisionOn: Date;
            };
        }[];
    }> => {
        const [orderKey, orderDirection] = query.orderBy ? query.orderBy.split(':') : [undefined, undefined];
        const where: WhereOptions<MicroCreditApplication> = {};
        if (query.status !== undefined) {
            where.status = query.status;
        }
        const applications = await models.microCreditApplications.findAndCountAll({
            attributes: ['id', 'amount', 'period', 'status', 'decisionOn', 'createdAt'],
            where,
            include: [
                {
                    model: models.appUser,
                    as: 'user',
                    attributes: ['address', 'firstName', 'lastName', 'avatarMediaPath']
                }
            ],
            order: [[orderKey || 'createdAt', orderDirection || 'desc']],
            offset: query.offset,
            limit: query.limit
        });

        return {
            count: applications.count,
            rows: applications.rows.map(a => {
                const v = { application: { ...a.toJSON(), appliedOn: a.createdAt } };
                delete v.application['user'];

                return {
                    ...v,
                    ...a.user!.toJSON()
                };
            })
        };
    };

    /**
     * @swagger
     *  components:
     *    schemas:
     *      getRepaymentsHistory:
     *        type: object
     *        properties:
     *          count:
     *            type: number
     *            description: total number of repayments
     *            example: 5
     *          repayments:
     *            type: array
     *            items:
     *              type: object
     *              properties:
     *                index:
     *                  type: number
     *                  description: repayment index
     *                  example: 1
     *                amount:
     *                  type: number
     *                  description: repayment amount
     *                  example: 7
     *                debt:
     *                  type: number
     *                  description: remain debt after repayment
     *                  example: 45
     *                timestamp:
     *                  type: number
     *                  description: repayment timestamp in seconds
     *                  example: 1623352800
     */
    /**
     * Using ethers underneath, get the repayment history of a borrower
     * @param query query params
     */
    public getRepaymentsHistory = async (query: {
        offset?: number;
        limit?: number;
        loanId: number;
        borrower: string;
    }): Promise<{
        count: number;
        rows: {
            index: number;
            amount: number;
            debt: number;
            timestamp: number;
        }[];
    }> => {
        const { borrower, loanId, offset, limit } = query;
        const provider = new JsonRpcProvider(config.jsonRpcUrl);
        const microcredit = new Contract(config.microcreditContractAddress, MicroCreditABI, provider);
        const totalRepayments = await getLoanRepayments(borrower, loanId);

        const repaymentsPromise: { date: number; amount: BigNumber }[] = [];
        // iterates from offset (or zero if offset not defined) to offset + the min between totalRepayments and limit (or 10 if limit not defined)
        for (let i = offset ?? 0; i < (offset ?? 0) + Math.min(totalRepayments, limit ?? 10); i++) {
            repaymentsPromise.push(microcredit.userLoanRepayments(borrower, loanId, i));
        }

        const repayments = await Promise.all(repaymentsPromise);

        return {
            count: totalRepayments,
            rows: repayments.map((r, i) => ({
                index: repayments.length - i,
                amount: r.amount.div(BigNumber.from(10).pow(18)).toNumber(),
                debt: 0,
                timestamp: parseInt(r.date.toString(), 10)
            }))
        };
    };

    /**
     * Get borrower profile, including docs and loans
     * @param address borrower address
     */
    public getBorrower = async (query: { address: string; include: string[] }) => {
        const { address, include } = query;
        const user = await models.appUser.findOne({
            attributes: ['id', 'address', 'firstName', 'lastName', 'avatarMediaPath'],
            where: {
                address
            }
        });

        if (!user) {
            throw new utils.BaseError('USER_NOT_FOUND', 'Borrower not found');
        }

        const [docs, forms, notes] = await Promise.all([
            include.includes('docs')
                ? models.microCreditDocs.findAll({
                      attributes: ['filepath', 'category'],
                      where: {
                          userId: user.id
                      },
                      order: [['createdAt', 'desc']]
                  })
                : Promise.resolve([]),
            include.includes('forms')
                ? models.microCreditApplications.findAll({
                      attributes: ['id', 'status', 'decisionOn', 'createdAt'],
                      where: {
                          userId: user.id
                      },
                      order: [['createdAt', 'desc']]
                  })
                : Promise.resolve([]),
            include.includes('notes')
                ? models.microCreditNote.findAll({
                      attributes: ['id', 'note', 'createdAt'],
                      include: [
                          {
                              model: models.appUser,
                              attributes: ['address', 'firstName', 'lastName'],
                              as: 'user'
                          }
                      ],
                      where: {
                          userId: user.id
                      },
                      order: [['createdAt', 'desc']]
                  })
                : Promise.resolve([])
        ]);
        const loans = await getBorrowerLoansCount(address);
        const lastLoanStatus = await getLastLoanStatus({ id: user.id, address: user.address });

        return {
            ...user.toJSON(),
            loans,
            lastLoanStatus,
            docs: docs.map(d => d.toJSON()),
            forms: forms.map(f => f.toJSON()),
            notes: notes.map(n => n.toJSON())
        };
    };

    /**
     * @swagger
     *  components:
     *    schemas:
     *      ageRange:
     *        type: object
     *        properties:
     *          ageRange1:
     *            type: number
     *            description: age range 18 - 24
     *          ageRange2:
     *            type: number
     *            description: age range 25 - 34
     *          ageRange3:
     *            type: number
     *            description: age range 35 - 44
     *          ageRange4:
     *            type: number
     *            description: age range 45 - 54
     *          ageRange5:
     *            type: number
     *            description: age range 55 - 64
     *          ageRange6:
     *            type: number
     *            description: age range 65+
     */

    /**
     * @swagger
     *  components:
     *    schemas:
     *      demographics:
     *        type: object
     *        properties:
     *          gender:
     *            type: array
     *            items:
     *              type: object
     *              properties:
     *                country:
     *                  type: string
     *                  description: country
     *                  example: BR
     *                male:
     *                  type: number
     *                  description: total user males
     *                female:
     *                  type: number
     *                  description: total user females
     *                undisclosed:
     *                  type: number
     *                  description: users with no information about gender
     *                totalGender:
     *                  type: number
     *                  description: total users
     *          ageRange:
     *            type: object
     *            properties:
     *              paid:
     *                $ref: '#/components/schemas/ageRange'
     *              pending:
     *                $ref: '#/components/schemas/ageRange'
     *              overdue:
     *                $ref: '#/components/schemas/ageRange'
     *
     */
    public demographics = async () => {
        try {
            // get all borrower addresses
            const limit = 100;
            const addresses: {
                paid: string[];
                pending: string[];
                overdue: string[];
            } = {
                paid: [],
                pending: [],
                overdue: []
            };

            for (let i = 0; ; i += limit) {
                const rawBorrowers = await getBorrowers({ limit, offset: i, onlyClaimed: true });
                if (rawBorrowers.borrowers.length === 0) break;

                rawBorrowers.borrowers.forEach(b => {
                    // create payment status
                    if (b.loan.lastDebt === '0') {
                        addresses.paid.push(getAddress(b.id));
                    } else {
                        const limitDate = new Date();
                        const claimed = new Date(b.loan.claimed * 1000);
                        limitDate.setSeconds(claimed.getSeconds() + b.loan.period);

                        if (limitDate > new Date()) {
                            addresses.overdue.push(getAddress(b.id));
                        } else {
                            addresses.pending.push(getAddress(b.id));
                        }
                    }
                });
            }

            const year = new Date().getUTCFullYear();
            const ageAttributes: any[] = [
                [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 18 AND 24)`), 'ageRange1'],
                [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 25 AND 34)`), 'ageRange2'],
                [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 35 AND 44)`), 'ageRange3'],
                [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 45 AND 54)`), 'ageRange4'],
                [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 55 AND 64)`), 'ageRange5'],
                [literal(`count(*) FILTER (WHERE ${year}-year BETWEEN 65 AND 120)`), 'ageRange6']
            ];
            const genderAttributes: any[] = [
                'country',
                [literal("count(*) FILTER (WHERE gender = 'm')"), 'male'],
                [literal("count(*) FILTER (WHERE gender = 'f')"), 'female'],
                [literal("count(*) FILTER (WHERE gender = 'u'  OR gender is null)"), 'undisclosed'],
                [literal('count(*)'), 'totalGender']
            ];

            // get age range and gender by payment status
            const [overdue, pending, paid, gender] = await Promise.all([
                models.appUser.findAll({
                    attributes: ageAttributes,
                    where: {
                        address: {
                            [Op.in]: addresses.overdue
                        }
                    },
                    raw: true
                }),
                models.appUser.findAll({
                    attributes: ageAttributes,
                    where: {
                        address: {
                            [Op.in]: addresses.pending
                        }
                    },
                    raw: true
                }),
                models.appUser.findAll({
                    attributes: ageAttributes,
                    where: {
                        address: {
                            [Op.in]: addresses.paid
                        }
                    },
                    raw: true
                }),
                models.appUser.findAll({
                    attributes: genderAttributes,
                    where: {
                        address: {
                            [Op.in]: [...addresses.paid, ...addresses.overdue, ...addresses.pending]
                        }
                    },
                    group: ['country'],
                    raw: true
                })
            ]);

            return {
                gender,
                ageRange: {
                    paid: paid[0],
                    pending: pending[0],
                    overdue: overdue[0]
                }
            };
        } catch (error) {
            throw new utils.BaseError('DEMOGRAPHICS_FAILED', error.message || 'failed to get microcredit demographics');
        }
    };

    /**
     * @swagger
     *  components:
     *    schemas:
     *      form:
     *        type: object
     *        properties:
     *          id:
     *            type: number
     *          userId:
     *            type: number
     *          form:
     *            type: object
     *          prismicId:
     *            type: number
     *          status:
     *            type: string
     *            description: pending, submitted, in-review, approved, rejected
     *
     */
    public getUserForm = async (userRequest: { userId: number; address: string }, formId: number) => {
        const userRoles = await getUserRoles(userRequest.address);
        if (userRoles.loanManager || userRoles.councilMember || userRoles.ambassador) {
            return await models.microCreditApplications.findOne({
                where: {
                    id: formId
                }
            });
        }

        const formResult = await models.microCreditApplications.findOne({
            where: {
                id: formId,
                userId: userRequest.userId
            }
        });

        if (formResult) {
            return formResult.toJSON();
        }

        throw new utils.BaseError('NOT_ALLOWED', 'should be a loanManager, councilMember, ambassador or form owner');
    };
}
