import { models } from '../../database';
import { getBorrowerLoansCount, getBorrowers, getLoanRepayments } from '../../subgraph/queries/microcredit';
import { getAddress } from '@ethersproject/address';
import { JsonRpcProvider } from '@ethersproject/providers';
import { MicrocreditABI as MicroCreditABI } from '../../contracts';
import { BigNumber, Contract } from 'ethers';
import { config } from '../../..';
import { WhereOptions, literal, Op, Order } from 'sequelize';
import { MicroCreditApplications } from '../../interfaces/microCredit/applications';
import { utils } from '@impactmarket/core';
import { AppUser } from '../../interfaces/app/appUser';
import { MicroCreditBorrowers } from '../../interfaces/microCredit/borrowers';
import { getUserRoles } from '../../subgraph/queries/user';

function mergeArrays(arr1: any[], arr2: any[], key: string, mergeIfUndefined = true) {
    const map = new Map(arr1.map(item => [item[key], item]));
    arr2.forEach(item => {
        if (map.has(item[key])) {
            Object.assign(map.get(item[key]), item);
        } else if (mergeIfUndefined) {
            map.set(item[key], item);
        }
    });
    return Array.from(map.values());
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
            firstName: string;
            lastName: string;
            avatarMediaPath: string;
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
        const isOrderByBackendData = query.orderBy && query.orderBy.indexOf('performance') !== -1;

        // build up database queries based on query params
        if (query.orderBy && isOrderByBackendData) {
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
            const borrowers = await models.microCreditBorrowers.findAll({
                attributes: ['performance'],
                where,
                order,
                // limit: query.limit,
                // offset: query.offset,
                include: [
                    {
                        model: models.appUser,
                        attributes: ['address', 'firstName', 'lastName', 'avatarMediaPath'],
                        as: 'user'
                    }
                ]
            });

            usersToFilter = borrowers.map(b => ({ ...b.user!.toJSON(), performance: b.performance }));
        }

        // get borrowers loans from subgraph
        // and return only the active loan
        const rawBorrowers = await getBorrowers({
            ...excludeDatabaseQueriesWhenSubgraph(query),
            onlyBorrowers: usersToFilter?.map(b => b.address),
            onlyClaimed: true,
            loanStatus: query.filter === 'repaid' ? 2 : query.filter === undefined ? undefined : 1
        });
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

        // merge borrowers loans and profile
        return {
            count: rawBorrowers.count,
            rows: isOrderByBackendData
                ? mergeArrays(usersToFilter, borrowers, 'address', false)
                : mergeArrays(borrowers, usersToFilter, 'address', false)
        };
    };

    // read application from models.microCreditApplications, including appUser to include profile
    public listApplications = async (query: {
        offset?: number;
        limit?: number;
        filter?: 'pending' | 'approved' | 'rejected';
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
        const where: WhereOptions<MicroCreditApplications> = {};
        // map filter to status (pending: 0, approved: 1, rejected: 2)
        const statusMap = {
            pending: 0,
            approved: 1,
            rejected: 2
        };
        if (query.filter !== undefined) {
            where.status = statusMap[query.filter];
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
    public getBorrower = async (query: { address: string }) => {
        const { address } = query;
        const borrower = await models.appUser.findOne({
            attributes: ['id', 'address', 'firstName', 'lastName', 'avatarMediaPath'],
            where: {
                address
            }
        });

        if (!borrower) {
            throw new utils.BaseError('USER_NOT_FOUND', 'Borrower not found');
        }

        const docs = await models.microCreditDocs.findAll({
            attributes: ['filepath', 'category'],
            where: {
                userId: borrower.id
            }
        });

        const loans = await getBorrowerLoansCount(address);

        return {
            ...borrower.toJSON(),
            loans,
            docs: docs.map(d => d.toJSON())
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
    public getUserForm = async (userRequest: { userId: number; address: string }, userId: number, status?: string) => {
        if (userId && userId !== userRequest.userId) {
            const userRoles = await getUserRoles(userRequest.address);
            if (
                (!userRoles.loanManager || userRoles.loanManager.state !== 0) &&
                (!userRoles.councilMember || userRoles.councilMember.state !== 0) &&
                (!userRoles.ambassador || userRoles.ambassador.state !== 0)
            ) {
                throw new utils.BaseError('NOT_ALLOWED', 'should be a loanManager, councilMember or ambassador');
            }
        }
        return await models.microCreditForm.findOne({
            where: {
                userId: userId || userRequest.userId,
                status: status || 'pending'
            }
        });
    };
}
