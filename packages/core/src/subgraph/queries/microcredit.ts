import { axiosMicrocreditSubgraph } from '../config';
import { intervalsInSeconds } from '../../types';
import { redisClient } from '../../database';

type Asset = {
    id: string;
    asset: string;
    amount: string;
};

export const getGlobalData = async (): Promise<{
    borrowed: number;
    debt: number;
    repaid: number;
    interest: number;
    loans: number;
    repaidLoans: number;
    liquidity: number;
    totalBorrowed: number;
    currentDebt: number;
    paidBack: number;
    earnedInterest: number;
    activeBorrowers: number;
    totalDebitsRepaid: number;
    liquidityAvailable: number;
}> => {
    try {
        const graphqlQuery = {
            operationName: 'microCredit',
            query: `query microCredit {
                microCredit(
                    id: 0
                ) {
                    borrowed {
                        asset
                        amount
                    }
                    debt {
                        asset
                        amount
                    }
                    repaid {
                        asset
                        amount
                    }
                    interest {
                        asset
                        amount
                    }
                    loans
                    repaidLoans
                    liquidity {
                        asset
                        amount
                    }
                }
            }`
        };

        const response = await axiosMicrocreditSubgraph.post<
            any,
            {
                data: {
                    data: {
                        microCredit: {
                            borrowed: Asset[];
                            debt: Asset[];
                            repaid: Asset[];
                            interest: Asset[];
                            loans: number;
                            repaidLoans: number;
                            liquidity: Asset[];
                        };
                    };
                };
            }
        >('', graphqlQuery);

        const microCredit = response.data?.data.microCredit;

        const borrowed =
            microCredit.borrowed && microCredit.borrowed.length ? parseFloat(microCredit.borrowed[0].amount) : 0;
        const debt = microCredit.debt && microCredit.debt.length ? parseFloat(microCredit.debt[0].amount) : 0;
        const repaid = microCredit.repaid && microCredit.repaid.length ? parseFloat(microCredit.repaid[0].amount) : 0;
        const interest =
            microCredit.interest && microCredit.interest.length ? parseFloat(microCredit.interest[0].amount) : 0;
        const loans = microCredit.loans ? microCredit.loans : 0;
        const repaidLoans = microCredit.repaidLoans ? microCredit.repaidLoans : 0;

        // TODO: this should be removed onde the website is updated
        const backwardsSupport: any = {
            totalBorrowed: borrowed,
            currentDebt: debt,
            paidBack: repaid,
            earnedInterest: interest,
            activeBorrowers: loans,
            totalDebitsRepaid: repaidLoans,
            liquidityAvailable: 0
        };

        return {
            borrowed,
            debt,
            repaid,
            interest,
            loans,
            repaidLoans,
            liquidity: 0,
            ...backwardsSupport
        };
    } catch (error) {
        throw new Error(error);
    }
};

export const getMicroCreditStatsLastDays = async (
    fromDayId: number,
    toDayId: number
): Promise<{
    borrowed: number;
    debt: number;
    repaid: number;
    interest: number;
}> => {
    try {
        const graphqlQuery = {
            operationName: 'microCredit',
            query: `query microCredit {
                microCredits(
                    where: {
                      id_gte: ${fromDayId}
                      id_lt: ${toDayId}
                    }
                ) {
                    borrowed {
                        asset
                        amount
                    }
                    debt {
                        asset
                        amount
                    }
                    repaid {
                        asset
                        amount
                    }
                    interest {
                        asset
                        amount
                    }
                }
            }`
        };

        const cacheResults = await redisClient.get(graphqlQuery.query);

        if (cacheResults) {
            return JSON.parse(cacheResults);
        }

        const response = await axiosMicrocreditSubgraph.post<
            any,
            {
                data: {
                    data: {
                        microCredits: {
                            borrowed: Asset[];
                            debt: Asset[];
                            repaid: Asset[];
                            interest: Asset[];
                        }[];
                    };
                };
            }
        >('', graphqlQuery);

        const microCredits = response.data?.data.microCredits;

        const borrowed = microCredits.reduce((acc, curr) => {
            if (curr.borrowed && curr.borrowed.length) {
                return acc + parseFloat(curr.borrowed[0].amount);
            }
            return acc;
        }, 0);

        const debt = microCredits.reduce((acc, curr) => {
            if (curr.debt && curr.debt.length) {
                return acc + parseFloat(curr.debt[0].amount);
            }
            return acc;
        }, 0);

        const repaid = microCredits.reduce((acc, curr) => {
            if (curr.repaid && curr.repaid.length) {
                return acc + parseFloat(curr.repaid[0].amount);
            }
            return acc;
        }, 0);

        const interest = microCredits.reduce((acc, curr) => {
            if (curr.interest && curr.interest.length) {
                return acc + parseFloat(curr.interest[0].amount);
            }
            return acc;
        }, 0);

        const stats = {
            borrowed,
            debt,
            repaid,
            interest
        };

        redisClient.set(graphqlQuery.query, JSON.stringify(stats), 'EX', intervalsInSeconds.twoMins);

        return stats;
    } catch (error) {
        throw new Error(error);
    }
};

export enum LoanStatus {
    pending = 0,
    active = 1,
    repaid = 2,
    canceled = 3
}

export type SubgraphGetBorrowersQuery = {
    offset?: number;
    limit?: number;
    addedBy?: string;
    loanStatus?: LoanStatus;
    onlyClaimed?: boolean;
    onlyBorrowers?: string[];
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
        | 'lastDebt:desc';
};

export const getBorrowerRepayments = async (query: {
    offset?: number;
    limit?: number;
    userAddress: string;
}): Promise<{ count: number; rows: { amount: number; timestamp: number; debt: number }[] }> => {
    const { offset, limit, userAddress } = query;
    const graphqlQuery = {
        operationName: 'getRepaymentsAndCount',
        query: `query getRepaymentsAndCount {
            repayments(
                first: ${limit ? limit : 10}
                skip: ${offset ? offset : 0}
                where: { borrower: "${userAddress.toLowerCase()}" }
                orderBy: timestamp
                orderDirection: desc
            ) {
                amount
                timestamp
                debt
            }
            borrower(id: "${userAddress.toLowerCase()}") {
                repaymentsCount
            }
        }`
    };

    const cacheResults = await redisClient.get(graphqlQuery.query);

    if (cacheResults) {
        return JSON.parse(cacheResults);
    }

    const response = await axiosMicrocreditSubgraph.post<
        any,
        {
            data: {
                data: {
                    repayments: {
                        amount: string;
                        timestamp: number;
                        debt: string;
                    }[];
                    borrower: {
                        repaymentsCount: number;
                    };
                };
            };
        }
    >('', graphqlQuery);

    const repaymentsAndCount = {
        count: response.data?.data.borrower.repaymentsCount,
        rows: response.data?.data.repayments.map((repayment: any) => ({
            amount: parseFloat(repayment.amount),
            debt: parseFloat(repayment.debt),
            timestamp: repayment.timestamp
        }))
    };
    redisClient.set(graphqlQuery.query, JSON.stringify(repaymentsAndCount), 'EX', intervalsInSeconds.halfHour);

    return repaymentsAndCount;
};

export const countGetBorrowers = async (query: SubgraphGetBorrowersQuery): Promise<number> => {
    const { addedBy, loanStatus, orderBy, onlyClaimed } = query;
    const [orderKey, orderDirection] = orderBy ? orderBy.split(':') : [undefined, undefined];

    const graphqlQuery = {
        operationName: 'borrowers',
        query: `query borrowers {
            borrowers(
                first: 1000
                skip: 0
                where: {
                    ${loanStatus !== undefined ? `lastLoanStatus: ${loanStatus}` : ''}
                    ${onlyClaimed === true ? `lastLoanStatus_not_in:[0,3]` : ''}
                    ${addedBy ? `lastLoanAddedBy: "${addedBy.toLowerCase()}"` : ''}
                }
                ${orderKey ? `orderBy: lastLoan${orderKey.charAt(0).toUpperCase() + orderKey.slice(1)}` : 'orderBy: id'}
                ${orderDirection ? `orderDirection: ${orderDirection}` : 'orderDirection: desc'}
            ) {
                id
            }
        }`
    };

    const cacheResults = await redisClient.get(graphqlQuery.query);

    if (cacheResults) {
        return JSON.parse(cacheResults);
    }

    const response = await axiosMicrocreditSubgraph.post<
        any,
        {
            data: {
                data: {
                    borrowers: {
                        id: string;
                    }[];
                };
            };
        }
    >('', graphqlQuery);

    const borrowers = response.data?.data.borrowers.length;
    redisClient.set(graphqlQuery.query, JSON.stringify(borrowers), 'EX', intervalsInSeconds.twoMins);

    return borrowers;
};

export const getUserLastLoanStatusFromSubgraph = async (userAddress: string): Promise<LoanStatus> => {
    const graphqlQuery = {
        operationName: 'borrowers',
        query: `query borrowers {
                borrower(id: "${userAddress.toLowerCase()}") {
                    lastLoanStatus
                }
            }`
    };

    const response = await axiosMicrocreditSubgraph.post<
        any,
        {
            data: {
                data: {
                    borrower: {
                        lastLoanStatus: LoanStatus;
                    };
                };
            };
        }
    >('', graphqlQuery);

    return response.data?.data.borrower.lastLoanStatus;
};

export const getBorrowers = async (
    query: SubgraphGetBorrowersQuery
): Promise<{
    count: number;
    borrowers: {
        // optional so it can be deleted from object!
        id: string;
        loan: {
            amount: string;
            period: number;
            dailyInterest: number;
            claimed: number;
            repaid: string;
            lastRepayment: number;
            lastRepaymentAmount: string;
            lastDebt: string;
        };
    }[];
}> => {
    const { offset, limit, addedBy, orderBy, loanStatus, onlyClaimed, onlyBorrowers } = query;

    // date 3 months ago
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    const [orderKey, orderDirection] = orderBy ? orderBy.split(':') : [undefined, undefined];

    const graphqlQuery = {
        operationName: 'borrowers',
        query: `query borrowers {
            borrowers(
                first: ${limit && !onlyBorrowers ? limit : 10}
                skip: ${offset && !onlyBorrowers ? offset : 0}
                where: {
                    ${loanStatus !== undefined ? `lastLoanStatus: ${loanStatus}` : ''}
                    ${onlyClaimed === true ? `lastLoanStatus_not_in:[0,3]` : ''}
                    ${
                        onlyBorrowers !== undefined
                            ? `id_in:${JSON.stringify(onlyBorrowers.map(b => b.toLowerCase()))}`
                            : ''
                    }
                    ${addedBy ? `lastLoanAddedBy: "${addedBy.toLowerCase()}"` : ''}
                }
                ${orderKey ? `orderBy: lastLoan${orderKey.charAt(0).toUpperCase() + orderKey.slice(1)}` : 'orderBy: id'}
                ${orderDirection ? `orderDirection: ${orderDirection}` : 'orderDirection: desc'}
            ) {
                id
                lastLoanAmount
                lastLoanPeriod
                lastLoanDailyInterest
                lastLoanClaimed
                lastLoanRepaid
                lastLoanLastRepayment
                lastLoanLastRepaymentAmount
                lastLoanLastDebt
            }
        }`
    };

    const cacheResults = await redisClient.get(graphqlQuery.query);

    if (cacheResults) {
        return JSON.parse(cacheResults);
    }

    const [count, response] = await Promise.all([
        countGetBorrowers(query),
        axiosMicrocreditSubgraph.post<
            any,
            {
                data: {
                    data: {
                        borrowers: {
                            id: string;
                            lastLoanAmount: string;
                            lastLoanPeriod: number;
                            lastLoanDailyInterest: number;
                            lastLoanClaimed: number;
                            lastLoanRepaid: string;
                            lastLoanLastRepayment: number;
                            lastLoanLastRepaymentAmount: string;
                            lastLoanLastDebt: string;
                        }[];
                    };
                };
            }
        >('', graphqlQuery)
    ]);

    const borrowers = response.data?.data.borrowers.map(borrower => ({
        loan: {
            amount: borrower.lastLoanAmount,
            period: borrower.lastLoanPeriod,
            dailyInterest: borrower.lastLoanDailyInterest,
            claimed: borrower.lastLoanClaimed,
            repaid: borrower.lastLoanRepaid,
            lastRepayment: borrower.lastLoanLastRepayment,
            lastRepaymentAmount: borrower.lastLoanLastRepaymentAmount,
            lastDebt: borrower.lastLoanLastDebt
        },
        id: borrower.id
    }));
    redisClient.set(graphqlQuery.query, JSON.stringify({ count, borrowers }), 'EX', intervalsInSeconds.twoMins);

    return { count, borrowers };
};

export const getBorrowerLoansCount = async (borrower: string): Promise<number> => {
    const graphqlQuery = {
        operationName: 'borrower',
        query: `query borrower {
            borrower(
                id: "${borrower.toLowerCase()}"
            ) {
                loans {
                    id
                }
            }
        }`
    };

    const cacheResults = await redisClient.get(graphqlQuery.query);

    if (cacheResults) {
        return JSON.parse(cacheResults);
    }

    const response = await axiosMicrocreditSubgraph.post<
        any,
        {
            data: {
                data: {
                    borrower: {
                        loans: string[];
                    };
                };
            };
        }
    >('', graphqlQuery);

    const loans = response.data?.data.borrower?.loans.length ?? 0;
    redisClient.set(graphqlQuery.query, JSON.stringify(loans), 'EX', intervalsInSeconds.twoMins);

    return loans;
};

export const getLoanRepayments = async (userAddress: string, loanId: number): Promise<number> => {
    const graphqlQuery = {
        operationName: 'loan',
        query: `query loan {
            loan(id: "${userAddress.toLowerCase()}-${loanId}") {
                repayments
            }
        }`
    };

    const cacheResults = await redisClient.get(graphqlQuery.query);

    if (cacheResults) {
        return JSON.parse(cacheResults);
    }

    const response = await axiosMicrocreditSubgraph.post<
        any,
        {
            data: {
                data: {
                    loan: {
                        repayments: number;
                    };
                };
            };
        }
    >('', graphqlQuery);

    const loanRepayments = response.data?.data.loan.repayments;
    redisClient.set(graphqlQuery.query, JSON.stringify(loanRepayments), 'EX', intervalsInSeconds.twoMins);

    return loanRepayments;
};

// get loanManager entity from the subgraph
export const getLoanManager = async (
    userAddress: string
): Promise<{
    state: number;
    borrowers: number;
}> => {
    const graphqlQuery = {
        operationName: 'loanManager',
        query: `query loanManager {
            loanManager(id: "${userAddress.toLowerCase()}") {
                state
                borrowers
            }
        }`
    };

    const cacheResults = await redisClient.get(graphqlQuery.query);

    if (cacheResults) {
        return JSON.parse(cacheResults);
    }

    const response = await axiosMicrocreditSubgraph.post<
        any,
        {
            data: {
                data: {
                    loanManager: {
                        state: number;
                        borrowers: number;
                    };
                };
            };
        }
    >('', graphqlQuery);

    const loanManager = response.data?.data.loanManager;

    redisClient.set(graphqlQuery.query, JSON.stringify(loanManager), 'EX', intervalsInSeconds.twoMins);

    return loanManager;
};
