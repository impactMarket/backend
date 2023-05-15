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
                        id
                        asset
                        amount
                    }
                    debt {
                        id
                        asset
                        amount
                    }
                    repaid {
                        id
                        asset
                        amount
                    }
                    interest {
                        id
                        asset
                        amount
                    }
                    borrowers
                    repayments
                    liquidity {
                        id
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
                            debit: Asset[];
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
                microCredit.debit && microCredit.debit.length
                    ? parseFloat(microCredit.debit[0].amount)
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
                    ${query.claimed ? `orderBy: claimed orderDirection: desc` : ''}
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
