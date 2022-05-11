import { gql } from 'apollo-boost';

import { clientDAO } from '../config';

export type UserRoles = {
    beneficiary: { community: string; state: number } | null;
    manager: { community: string; state: number } | null;
};

export const getUserRoles = async (address: string): Promise<UserRoles> => {
    try {
        const query = gql`
            {
                beneficiaryEntity(
                    id: "${address.toLowerCase()}"
                ) {
                    community {
                        id
                    }
                    state
                }
                managerEntity(
                    id: "${address.toLowerCase()}"
                ) {
                    community {
                        id
                    }
                    state
                }
            }
        `;

        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        const beneficiary =
            queryResult.data.beneficiaryEntity === null
                ? null
                : {
                      community:
                          queryResult.data?.beneficiaryEntity?.community?.id,
                      state: queryResult.data?.beneficiaryEntity?.state,
                  };

        const manager =
            queryResult.data.managerEntity === null
                ? null
                : {
                      community: queryResult.data.managerEntity?.community?.id,
                      state: queryResult.data.managerEntity?.state,
                  };

        return {
            beneficiary,
            manager,
        };
    } catch (error) {
        throw new Error(error);
    }
};

export const getUserActivity = async (
    address: string,
    community: string,
    offset?: number,
    limit?: number,
): Promise<{
    id: string;
    by: string;
    user: string;
    community: {
        id: string;
    }
    activity: number;
    timestamp: number;
}[]> => {
    try {
        const query = gql`
            {
                userActivityEntities(
                    first: ${limit ? limit : 1000}
                    skip: ${offset ? offset : 0}
                    where: {
                        user: "${address.toLowerCase()}"
                        community: "${community.toLowerCase()}"
                    }
                    orderBy: timestamp
                    orderDirection: desc
                ) {
                    id
                    by
                    user
                    community {
                        id
                    }
                    activity
                    timestamp
                }
            }
        `;

        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'cache-first',
        });

        return queryResult.data.userActivityEntities;
    } catch (error) {
        throw new Error(error);
    }
};