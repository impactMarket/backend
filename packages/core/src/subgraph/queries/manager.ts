import { axiosSubgraph } from '../config';
import { ManagerSubgraph } from '../interfaces/manager';
import { redisClient } from '../../database';
import { intervalsInSeconds } from '../../types';

export const getCommunityManagers = async (
    communityAddress: string,
    state?: string,
    addresses?: string[],
    orderBy?: string,
    orderDirection?: string,
    limit?: number,
    offset?: number
): Promise<ManagerSubgraph[]> => {
    try {
        const idsFormated = addresses?.map((el) => `"${el.toLowerCase()}"`);
        const graphqlQuery = {
            operationName: 'managerEntities',
            query: `query managerEntities {
                managerEntities(
                    ${limit ? `first: ${limit}` : ''}
                    ${offset ? `skip: ${offset}` : ''}
                    ${orderBy ? orderBy : ''}
                    ${orderDirection ? orderDirection : ''}
                    where: {
                        community: "${communityAddress.toLowerCase()}"
                        ${state ? state : ''}
                        ${
                            idsFormated && idsFormated.length > 0
                                ? `address_in: [${idsFormated}]`
                                : ''
                        }
                    }
                ) {
                    address
                    state
                    added
                    removed
                    since
                    until
                }
            }`,
        };
        const cacheResults = await redisClient.get(graphqlQuery.query);

        if (cacheResults) {
            return JSON.parse(cacheResults);
        }

        const response = await axiosSubgraph.post<
            any,
            {
                data: {
                    data: {
                        managerEntities: {
                            address: string,
                            state: number,
                            added: number,
                            removed: number,
                            since: number,
                            until: number,
                        }[];
                    };
                };
            }
        >('', graphqlQuery);

        const managerEntities = response.data?.data.managerEntities;

        redisClient.set(
            graphqlQuery.query,
            JSON.stringify(managerEntities),
            'EX',
            intervalsInSeconds.oneHour
        );

        return managerEntities;
    } catch (error) {
        throw new Error(error);
    }
};

export const countManagers = async (
    community: string,
    state?: number
): Promise<number> => {
    try {
        const graphqlQuery = {
            operationName: 'communityEntity',
            query: `query communityEntity {
                communityEntity(
                    id: "${community.toLowerCase()}"
                ) {
                    managers
                    removedManagers
                }
            }`,
        };
        const cacheResults = await redisClient.get(graphqlQuery.query);

        if (cacheResults) {
            return JSON.parse(cacheResults);
        }

        const response = await axiosSubgraph.post<
            any,
            {
                data: {
                    data: {
                        communityEntity: {
                            managers: number,
                            removedManagers: number,
                        };
                    };
                };
            }
        >('', graphqlQuery);

        const communityEntity = response.data?.data.communityEntity;

        redisClient.set(
            graphqlQuery.query,
            JSON.stringify(communityEntity),
            'EX',
            intervalsInSeconds.oneHour
        );

        if (state === 0) {
            return communityEntity.managers;
        } else if (state === 1) {
            return communityEntity.removedManagers;
        } else {
            return (
                communityEntity.managers +
                communityEntity.removedManagers
            );
        }
    } catch (error) {
        throw new Error(error);
    }
};
