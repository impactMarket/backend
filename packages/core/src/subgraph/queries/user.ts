import { gql } from 'apollo-boost';

import { clientDAO, clientCouncil } from '../config';

export type UserRoles = {
    beneficiary: { community: string; state: number } | null;
    manager: { community: string; state: number } | null;
    councilMember: { state: number } | null;
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

        const queryCouncil = gql`
            {
                impactMarketCouncilMemberEntity(
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

        const queryCouncilResult = await clientCouncil.query({
            query: queryCouncil,
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

        const councilMember = !queryCouncilResult.data.impactMarketCouncilMemberEntity
            ? null
            : {
                  state: queryCouncilResult.data.impactMarketCouncilMemberEntity.status,
              };

        const ambassador = !queryCouncilResult.data.ambassadorEntity
            ? null
            : {
                  communities:
                      queryCouncilResult.data.ambassadorEntity?.communities,
                  state: queryCouncilResult.data.ambassadorEntity?.status,
              };
        return {
            beneficiary,
            manager,
            councilMember,
            ambassador,
        };
    } catch (error) {
        throw new Error(error);
    }
};

export const getUserActivity = async (
    address: string,
    community: string,
    offset?: number,
    limit?: number
): Promise<
    {
        id: string;
        by: string;
        user: string;
        community: {
            id: string;
        };
        activity: number;
        timestamp: number;
    }[]
> => {
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
