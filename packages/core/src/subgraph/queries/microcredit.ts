import { intervalsInSeconds } from '../../types';
import { redisClient } from '../../database';
import { axiosMicrocreditSubgraph } from '../config';

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

export type SubgraphGetBorrowersQuery = {
    offset?: number;
    limit?: number;
    addedBy: string;
    claimed?: boolean;
    filter?: 'repaid' | 'needHelp';
    orderBy?: 'amount' | 'period' | 'lastRepayment' | 'lastDebt';
    orderDirection?: 'desc' | 'asc';
};

const filtersToBorrowersQuery = (filter: 'repaid' | 'needHelp' | undefined): string => {
    switch (filter) {
        case 'repaid':
            return 'lastDebt: 0';
        case 'needHelp':
            // date 3 months ago
            const date = new Date();
            date.setMonth(date.getMonth() - 3);
            return `lastRepayment_lte: ${Math.floor(date.getTime() / 1000)}`;
        default:
            return 'lastDebt_not: 0';
    }
};

const countGetBorrowers = async (query: SubgraphGetBorrowersQuery): Promise<number | string[]> => {
    const { addedBy, claimed, filter, orderBy, orderDirection } = query;

    const graphqlQuery = {
        operationName: 'borrowers',
        query: `query borrowers {
            loans(
                first: 1000
                skip: 0
                where: {
                    addedBy: "${addedBy.toLowerCase()}"
                    ${claimed ? 'claimed_not: null' : ''}
                    ${filtersToBorrowersQuery(filter)}
                }
                ${orderBy ? `orderBy: ${orderBy}` : ''}
                ${orderDirection ? `orderDirection: ${orderDirection}` : ''}
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
                    loans: {
                        id: string;
                    }[];
                };
            };
        }
    >('', graphqlQuery);

    let borrowers = 0;

    if (filter === 'repaid') {
        const mapped = response.data?.data.loans.map(loan => loan.id.toLowerCase().split('-')[0]);
        const raw = [...new Set(mapped)];
        redisClient.set(graphqlQuery.query, JSON.stringify(raw), 'EX', intervalsInSeconds.twoMins);

        return raw;
    }

    borrowers = response.data?.data.loans.length;
    redisClient.set(graphqlQuery.query, JSON.stringify(borrowers), 'EX', intervalsInSeconds.twoMins);

    return borrowers;
};

export const getBorrowers = async (
    query: SubgraphGetBorrowersQuery
): Promise<{
    count: number;
    borrowers: {
        // optional so it can be deleted from object!
        borrower?: {
            id: string;
        };
        amount: string;
        period: number;
        dailyInterest: number;
        claimed: number;
        repaid: string;
        lastRepayment: number;
        lastRepaymentAmount: string;
        lastDebt: string;
    }[];
}> => {
    const { offset, limit, addedBy, claimed, filter, orderBy, orderDirection } = query;

    // date 3 months ago
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    const countOrList = await countGetBorrowers(query);

    const graphqlQuery = {
        operationName: 'borrowers',
        query: `query borrowers {
            loans(
                first: ${limit ? limit : 10}
                skip: ${offset ? offset : 0}
                where: {
                    addedBy: "${addedBy.toLowerCase()}"
                    ${claimed ? 'claimed_not: null' : ''}
                    ${filtersToBorrowersQuery(filter)}
                    ${filter === 'repaid' ? `borrower_in: ${JSON.stringify(countOrList)}` : ''}
                }
                ${orderBy ? `orderBy: ${orderBy}` : ''}
                ${orderDirection ? `orderDirection: ${orderDirection}` : ''}
            ) {
                borrower {
                    id
                }
                amount
                period
                dailyInterest
                claimed
                repaid
                lastRepayment
                lastRepaymentAmount
                lastDebt
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
                    loans: {
                        borrower: {
                            id: string;
                        };
                        amount: string;
                        period: number;
                        dailyInterest: number;
                        claimed: number;
                        repaid: string;
                        lastRepayment: number;
                        lastRepaymentAmount: string;
                        lastDebt: string;
                    }[];
                };
            };
        }
    >('', graphqlQuery);

    const borrowers = response.data?.data.loans;
    let count = 0;
    redisClient.set(graphqlQuery.query, JSON.stringify(borrowers), 'EX', intervalsInSeconds.twoMins);

    if (countOrList instanceof Array) {
        count = countOrList.length;
    } else {
        count = countOrList;
    }

    return { count, borrowers };
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
