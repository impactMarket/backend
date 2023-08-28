import { MicroCreditApplication, MicroCreditApplicationStatus } from '../../interfaces/microCredit/applications';
import { MicroCreditBorrowers } from '../../interfaces/microCredit/borrowers';
import { Op, Order, WhereOptions, literal } from 'sequelize';
import { config } from '../../..';
import { getAddress } from '@ethersproject/address';
import {
    getBorrowerLoansCount,
    getBorrowerRepayments,
    getBorrowers,
    getUserLastLoanStatusFromSubgraph
} from '../../subgraph/queries/microcredit';
import { getUserRoles } from '../../subgraph/queries/user';
import { models } from '../../database';
import { utils } from '@impactmarket/core';
export enum LoanStatus {
    NO_LOAN = 0,
    FORM_DRAFT = 1,
    PENDING_REVIEW = 2,
    REQUEST_CHANGES = 3,
    INTERVIEW = 4,
    APPROVED = 5,
    REJECTED = 6,
    PENDING_CLAIM = 7,
    CLAIMED = 8,
    FULL_REPAID = 9,
    CANCELED = 10
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
            return status + 7;
        } catch (e) {
            return LoanStatus.NO_LOAN;
        }
    }

    switch (form.status) {
        case MicroCreditApplicationStatus.DRAFT:
            return LoanStatus.FORM_DRAFT;
        case MicroCreditApplicationStatus.PENDING:
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
    filter?: 'all' | 'not-claimed' | 'ontrack' | 'need-help' | 'repaid';
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
                amount: number;
                period: number;
                dailyInterest: number;
                claimed: number;
                repaid: number;
                lastRepayment: number;
                lastRepaymentAmount: number;
                lastDebt: number;
            };
        }[];
    }> => {
        let order: Order | undefined;
        let where: WhereOptions<MicroCreditBorrowers> | undefined;

        // build up database queries based on query params
        if (query.orderBy && query.orderBy.indexOf('performance') !== -1) {
            order = [[literal('performance'), query.orderBy.indexOf('asc') !== -1 ? 'ASC' : 'DESC']];
        } else if (query.orderBy) {
            const [field, direction] = query.orderBy.split(':');
            order = [[literal(`"user.loan.${field}"`), direction || 'ASC']];
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

        const mapFilterToLoanStatus = (filter: GetBorrowersQuery['filter']) => {
            switch (filter) {
                case 'not-claimed':
                    return {
                        status: 0
                    };
                case 'repaid':
                    return {
                        status: 2
                    };
                case 'ontrack':
                case 'need-help':
                    return {
                        status: 1
                    };
                default:
                    return {};
            }
        };

        const rBorrowers = await models.microCreditBorrowers.findAndCountAll({
            attributes: ['performance'],
            where: {
                ...where,
                manager: query.addedBy
            },
            order,
            limit: query.limit || config.defaultLimit,
            offset: query.offset || config.defaultOffset,
            include: [
                {
                    model: models.appUser,
                    attributes: ['address', 'firstName', 'lastName', 'avatarMediaPath'],
                    as: 'user',
                    required: true,
                    include: [
                        {
                            model: models.subgraphMicroCreditBorrowers,
                            as: 'loan',
                            where: {
                                ...mapFilterToLoanStatus(query.filter)
                            }
                        }
                    ]
                }
            ]
        });

        return {
            count: rBorrowers.count,
            rows: rBorrowers.rows.map(r => ({
                ...r.user!.toJSON(),
                loan: r.user!.loan!,
                performance: r.performance
            }))
        };
    };

    // read application from models.microCreditApplications, including appUser to include profile
    public listApplications = async (
        userId: number,
        query: {
            offset?: number;
            limit?: number;
            status?: number;
            orderBy?: 'appliedOn' | 'appliedOn:asc' | 'appliedOn:desc';
        }
    ): Promise<{
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
        const where: WhereOptions<MicroCreditApplication> = { selectedLoanManagerId: userId };
        if (query.status !== undefined) {
            where.status = query.status;
        } else {
            where.status = {
                [Op.not]: MicroCreditApplicationStatus.DRAFT
            };
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
        address: string;
    }): Promise<{
        count: number;
        rows: {
            amount: number;
            debt: number;
            timestamp: number;
        }[];
    }> => {
        const { address: userAddress, offset, limit } = query;

        return await getBorrowerRepayments({ userAddress, offset, limit });
    };

    /**
     * Get borrower profile, including docs and loans
     * @param address borrower address
     */
    public getBorrower = async (query: { address?: string; include: string[]; formId?: number }) => {
        const { include, formId } = query;
        let { address } = query;

        if (formId) {
            const microcreditApplication = await models.microCreditApplications.findOne({
                attributes: [],
                include: [
                    {
                        attributes: ['address'],
                        model: models.appUser,
                        as: 'user'
                    }
                ],
                where: {
                    id: formId
                }
            });

            if (microcreditApplication?.user?.address) {
                address = microcreditApplication.user.address;
            }
        }

        if (!address) {
            throw new utils.BaseError('INVALID_PARAMS', 'address or formId is expected');
        }

        const year = new Date().getUTCFullYear();
        const user = await models.appUser.findOne({
            attributes: [
                'id',
                'address',
                'firstName',
                'lastName',
                'avatarMediaPath',
                'country',
                'gender',
                'email',
                'phone',
                [literal(`${year}-year`), 'age']
            ],
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
                              as: 'manager'
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

    public getLoanManagersByCountry = async (country: string) => {
        let loanManagers: number[] = [];

        // TODO: this is hardcoded for now, but we should have a better way to do this
        if (config.jsonRpcUrl.indexOf('alfajores') !== -1) {
            switch (country.toLowerCase()) {
                case 'br':
                    loanManagers = [5857, 5855, 5898];
                    break;
                case 'ug':
                    loanManagers = [5855, 5801, 5896];
                    break;
                case 'ng':
                    loanManagers = [5853, 5700, 5893];
                    break;
                // case 've':
                default:
                    loanManagers = [5853, 5857, 5801, 5891];
                    break;
            }
        } else {
            switch (country.toLowerCase()) {
                case 'br':
                    loanManagers = [12928, 106251];
                    break;
                case 'ug':
                    loanManagers = [30880, 106251];
                    break;
                // case 'ng':
                // case 've':
                default:
                    loanManagers = [106251];
                    break;
            }
        }

        const users = await models.appUser.findAll({
            attributes: ['id', 'address', 'firstName', 'lastName', 'avatarMediaPath'],
            where: {
                id: {
                    [Op.in]: loanManagers
                }
            }
        });

        return users.map(u => u.toJSON());
    };
}
