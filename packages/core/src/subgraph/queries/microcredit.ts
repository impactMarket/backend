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
            }`,
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
            microCredit.borrowed && microCredit.borrowed.length
                ? parseFloat(microCredit.borrowed[0].amount)
                : 0;
        const debt =
            microCredit.debt && microCredit.debt.length
                ? parseFloat(microCredit.debt[0].amount)
                : 0;
        const repaid =
            microCredit.repaid && microCredit.repaid.length
                ? parseFloat(microCredit.repaid[0].amount)
                : 0;
        const interest =
            microCredit.interest && microCredit.interest.length
                ? parseFloat(microCredit.interest[0].amount)
                : 0;
        const loans = microCredit.loans ? microCredit.loans : 0;
        const repaidLoans = microCredit.repaidLoans
            ? microCredit.repaidLoans
            : 0;

        // TODO: this should be removed onde the website is updated
        const backwardsSupport: any = {
            totalBorrowed: borrowed,
            currentDebt: debt,
            paidBack: repaid,
            earnedInterest: interest,
            activeBorrowers: loans,
            totalDebitsRepaid: repaidLoans,
            liquidityAvailable: 0,
        };

        return {
            borrowed,
            debt,
            repaid,
            interest,
            loans,
            repaidLoans,
            liquidity: 0,
            ...backwardsSupport,
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
            }`,
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
            interest,
        };

        redisClient.set(
            graphqlQuery.query,
            JSON.stringify(stats),
            'EX',
            intervalsInSeconds.twoMins
        );

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

export const getBorrowers = async (
    query: SubgraphGetBorrowersQuery
): Promise<
    {
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
    }[]
> => {
    const { offset, limit, addedBy, claimed, filter, orderBy, orderDirection } = query;

    // date 3 months ago
    const date = new Date();
    date.setMonth(date.getMonth() - 3);

    const graphqlQuery = {
        operationName: 'borrowers',
        query: `query borrowers {
            loans(
                first: ${limit ? limit : 10}
                skip: ${offset ? offset : 0}
                where: {
                    addedBy: "${addedBy.toLowerCase()}"
                    ${claimed ? 'claimed_not: null' : ''}
                    ${filter && filter === 'needHelp' ? `lastRepayment_lte: ${date.getTime() / 1000}` : ''}
                    ${filter !== undefined ? (filter === 'repaid' ? 'lastDebt: 0' : 'lastDebt_not: 0') : ''}
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

    redisClient.set(graphqlQuery.query, JSON.stringify(borrowers), 'EX', intervalsInSeconds.twoMins);

    return borrowers;
};

export const getLoanRepayments = async (
    userAddress: string,
    loanId: number
): Promise<number> => {
    const graphqlQuery = {
        operationName: 'loan',
        query: `query loan {
            loan(id: "${userAddress.toLowerCase()}-${loanId}") {
                repayments
            }
        }`,
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

    redisClient.set(
        graphqlQuery.query,
        JSON.stringify(loanRepayments),
        'EX',
        intervalsInSeconds.twoMins
    );

    return loanRepayments;
};

// get loanManager entity from the subgraph
export const getLoanManager = async (userAddress: string): Promise<{
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
        }`,
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

    redisClient.set(
        graphqlQuery.query,
        JSON.stringify(loanManager),
        'EX',
        intervalsInSeconds.twoMins
    );

    return loanManager;
};
