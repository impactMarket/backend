import { gql } from 'apollo-boost';

import { clientDAO } from '../config';

export const getUbiDailyEntity = async (
    date: Date
): Promise<{ beneficiaries: number }> => {
    try {
        const dayId = (((date.getTime() / 1000) | 0) / 86400) | 0;
        const query = gql`
            {
                ubidailyEntities(
                    where: {
                        id: ${dayId}
                    }
                ) {
                    beneficiaries
                }
            }
        `;

        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        return queryResult.data?.ubidailyEntities[0];
    } catch (error) {
        throw new Error(error);
    }
};
