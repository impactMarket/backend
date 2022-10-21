import { gql } from 'apollo-boost';
import { BigNumber } from 'bignumber.js';

import { clientDAO } from '../config';

export const getUbiDailyEntity = async (
    startDate: number,
    endDate?: number
): Promise<
    {
        tClaimed: string;
        tClaims: number;
        tBeneficiaries: number;
        tRaised: string;
        tBackers: number;
        fundingRate: number;
        tVolume: string;
        tTransactions: number;
        tReach: number;
        tReachOut: number;
    }[]
> => {
    try {
        const query = gql`
            {
                ubidailyEntities(
                    where: {
                        ${
                            !endDate
                                ? `id:"${startDate}"`
                                : `
                            id_gte:"${startDate}"
                            id_lt: ${endDate}
                        `
                        }    
                    }
                    orderBy: id 
                    orderDirection: desc
                ) {
                    claimed
                    claims
                    beneficiaries
                    contributed
                    contributors
                    fundingRate
                    volume
                    transactions
                    reach
                }
            }
        `;
        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        const toToken = (value: string) =>
            new BigNumber(value).multipliedBy(10 ** 18).toString();

        return queryResult.data.ubidailyEntities.map((el) => ({
            tClaimed: toToken(el.claimed),
            tClaims: el.claims,
            tBeneficiaries: el.beneficiaries,
            tRaised: toToken(el.contributed),
            tBackers: el.contributors,
            fundingRate: parseInt(el.fundingRate, 10),
            tVolume: toToken(el.volume),
            tTransactions: parseInt(el.transactions, 10),
            tReach: el.reach,
            tReachOut: 0,
        }));
    } catch (error) {
        throw new Error(error);
    }
};
