import { intervalsInSeconds } from '../../types';
import { redisClient } from '../../database';
import { axiosMicrocreditSubgraph } from '../config';

type Asset = {
    id: string;
    asset: string;
    amount: string;
};

export const getGlobalData = async (): Promise<{
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
                    borrowers
                    repayments
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
                            borrowers: number;
                            repayments: number;
                            liquidity: Asset[];
                        };
                    };
                };
            }
        >('', graphqlQuery);

        const microCredit = response.data?.data.microCredit;

        return {
            totalBorrowed:
                microCredit.borrowed && microCredit.borrowed.length
                    ? parseFloat(microCredit.borrowed[0].amount)
                    : 0,
            currentDebt:
                microCredit.debt && microCredit.debt.length
                    ? parseFloat(microCredit.debt[0].amount)
                    : 0,
            paidBack:
                microCredit.repaid && microCredit.repaid.length
                    ? parseFloat(microCredit.repaid[0].amount)
                    : 0,
            earnedInterest:
                microCredit.interest && microCredit.interest.length
                    ? parseFloat(microCredit.interest[0].amount)
                    : 0,
            activeBorrowers: microCredit.borrowers ? microCredit.borrowers : 0,
            totalDebitsRepaid: microCredit.repayments
                ? microCredit.repayments
                : 0,
            liquidityAvailable:
                microCredit.liquidity && microCredit.liquidity.length
                    ? parseFloat(microCredit.liquidity[0].amount)
                    : 0,
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

export const getBorrowers = async (query: {
    offset?: number;
    limit?: number;
    addedBy?: string;
    claimed?: boolean;
}): Promise<
    {
        id: string;
        loans: {
            amount: string;
            period: number;
            dailyInterest: number;
            claimed: number;
            repayed: string;
            lastRepayment: number;
            lastRepaymentAmount: string;
            lastDebt: string;
        }[];
    }[]
> => {
    const graphqlQuery = {
        operationName: 'borrowers',
        query: `query borrowers {
            borrowers(
                first: ${query.limit ? query.limit : 10}
                skip: ${query.offset ? query.offset : 0}
            ) {
                id
                loans(
                    where: {
                        addedBy: "${
                            query.addedBy ? query.addedBy.toLowerCase() : ''
                        }"
                        ${query.claimed ? `claimed_not: null` : ''}
                    }
                    ${
                        query.claimed
                            ? `orderBy: claimed orderDirection: desc`
                            : ''
                    }
                ) {
                    amount
                    period
                    dailyInterest
                    claimed
                    repayed
                    lastRepayment
                    lastRepaymentAmount
                    lastDebt
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
                    borrowers: {
                        id: string;
                        loans: {
                            amount: string;
                            period: number;
                            dailyInterest: number;
                            claimed: number;
                            repayed: string;
                            lastRepayment: number;
                            lastRepaymentAmount: string;
                            lastDebt: string;
                        }[];
                    }[];
                };
            };
        }
    >('', graphqlQuery);

    const borrowers = response.data?.data.borrowers.filter(
        (b) => b.loans.length > 0
    );

    redisClient.set(
        graphqlQuery.query,
        JSON.stringify(borrowers),
        'EX',
        intervalsInSeconds.twoMins
    );

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
