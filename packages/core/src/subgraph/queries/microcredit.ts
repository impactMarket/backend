import { axiosMicrocreditSubgraph } from '../config';

type Asset = {
    id: string,
    asset: string,
    amount: string,
}

export const getGlobalData = async (): Promise<{
    totalBorrowed: number,
    currentDebt: number,
    paidBack: number,
    earnedInterest: number,
    activeBorrowers: number,
    totalDebitsRepaid: number,
    liquidityAvailable: number,
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
                            borrowed: Asset[],
                            debit: Asset[],
                            repaid: Asset[],
                            interest: Asset[],
                            borrowers: number,
                            repayments: number,
                            liquidity: Asset[],
                        };
                    };
                };
            }
        >('', graphqlQuery);

        const microCredit = response.data?.data.microCredit;

        return {
            totalBorrowed: microCredit.borrowed && microCredit.borrowed.length ? parseFloat(microCredit.borrowed[0].amount) : 0,
            currentDebt: microCredit.debit && microCredit.debit.length ? parseFloat(microCredit.debit[0].amount) : 0,
            paidBack: microCredit.repaid && microCredit.repaid.length ? parseFloat(microCredit.repaid[0].amount) : 0,
            earnedInterest: microCredit.interest && microCredit.interest.length ? parseFloat(microCredit.interest[0].amount) : 0,
            activeBorrowers: microCredit.borrowers ? microCredit.borrowers : 0,
            totalDebitsRepaid: microCredit.repayments ? microCredit.repayments : 0,
            liquidityAvailable: microCredit.liquidity && microCredit.liquidity.length ? parseFloat(microCredit.liquidity[0].amount) : 0,
        };

    } catch (error) {
        throw new Error(error);
    }
};