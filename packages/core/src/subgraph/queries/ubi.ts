import { gql } from 'apollo-boost';

import { clientDAO } from '../config';

export const getUbiDailyEntity = async (
    where: string
): Promise<
    {
        beneficiaries: number;
        claimed: string;
        volume: string;
        transactions: number;
        contributed: string;
        contributors: number;
        reach: number;
        fundingRate: string;
    }[]
> => {
    try {
        const query = gql`
            {
                ubidailyEntities(
                    first: 1000
                    where: {
                        ${where}
                    }
                ) {
                    beneficiaries
                    claimed
                    volume
                    transactions
                    contributed
                    contributors
                    reach
                    fundingRate
                }
            }
        `;

        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        return queryResult.data?.ubidailyEntities?.length
            ? queryResult.data.ubidailyEntities
            : [];
    } catch (error) {
        throw new Error(error);
    }
};
