import { gql } from 'apollo-boost';

import { clientDAO, clientSubDAO } from '../config';

export type UserRoles = {
    beneficiary: { community: string; state: number } | null;
    manager: { community: string; state: number } | null;
    subDAOMember: { state: number } | null;
    ambassador: { communities: string[]; state: number } | null;
};

export const getUserRoles = async (address: string): Promise<UserRoles> => {
    try {
        const queryDAO = gql`
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

        const querySubDAO = gql`
            {
                subDAOMemberEntity(
                    id: "${address.toLowerCase()}"
                ) {
                    status
                }
                ambassadorEntity(
                    id: "${address.toLowerCase()}"
                ) {
                    status
                    communities
                }
            }
        `;

        const queryDAOResult = await clientDAO.query({
            query: queryDAO,
            fetchPolicy: 'no-cache',
        });

        const querySubDAOResult = await clientSubDAO.query({
            query: querySubDAO,
            fetchPolicy: 'no-cache',
        });

        const beneficiary = !queryDAOResult.data.beneficiaryEntity
            ? null
            : {
                  community:
                      queryDAOResult.data?.beneficiaryEntity?.community?.id,
                  state: queryDAOResult.data?.beneficiaryEntity?.state,
              };

        const manager = !queryDAOResult.data.managerEntity
            ? null
            : {
                  community: queryDAOResult.data.managerEntity?.community?.id,
                  state: queryDAOResult.data.managerEntity?.state,
              };

        const subDAOMember = !querySubDAOResult.data.subDAOMemberEntity
            ? null
            : {
                  state: querySubDAOResult.data.subDAOMemberEntity.status,
              };

        const ambassador = !querySubDAOResult.data.ambassadorEntity
            ? null
            : {
                  communities:
                      querySubDAOResult.data.ambassadorEntity?.communities,
                  state: querySubDAOResult.data.ambassadorEntity?.status,
              };
        return {
            beneficiary,
            manager,
            subDAOMember,
            ambassador,
        };
    } catch (error) {
        throw new Error(error);
    }
};
