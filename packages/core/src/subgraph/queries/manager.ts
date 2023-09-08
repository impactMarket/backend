import { CommunityEntity, ManagerEntity } from '@impact-market/subgraph';
import { queryAndTransformResponse } from './utils';

export const getCommunityManagers = async (
    communityAddress: string,
    state?: string,
    addresses?: string[],
    orderBy?: string,
    orderDirection?: string,
    limit?: number,
    offset?: number
): Promise<ManagerEntity[]> => {
    const graphqlQuery = {
        operationName: 'managerEntities',
        query: `query managerEntities {
            managerEntities(
                ${limit ? `first: ${limit}` : ''}
                ${offset ? `skip: ${offset}` : ''}
                ${orderBy ?? ''}
                ${orderDirection ?? ''}
                where: {
                    community: "${communityAddress.toLowerCase()}"
                    ${state ?? ''}
                    ${
                        addresses && addresses.length > 0
                            ? `address_in: ${JSON.stringify(addresses?.map(el => el.toLowerCase()))}`
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
        }`
    };

    return queryAndTransformResponse<ManagerEntity[]>(graphqlQuery);
};

export const countManagers = async (community: string, state?: number): Promise<number> => {
    const graphqlQuery = {
        operationName: 'communityEntity',
        query: `query communityEntity {
            communityEntity(
                id: "${community.toLowerCase()}"
            ) {
                managers
                removedManagers
            }
        }`
    };

    return queryAndTransformResponse<CommunityEntity, number>(graphqlQuery, v => {
        if (state === 0) {
            return v.managers;
        } else if (state === 1) {
            return v.removedManagers;
        }
        return v.managers + v.removedManagers;
    });
};
