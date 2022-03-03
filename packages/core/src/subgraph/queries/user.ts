import { gql } from 'apollo-boost';

import { client } from '../config';

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

        const queryResult = await client.query({
            query,
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
