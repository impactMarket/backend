import { axiosSubgraph } from '../config';
import { intervalsInSeconds } from '../../types';
import { redisClient } from '../../database';

export type SubgraphResponse<T> = { data: T };

export function queryAndTransformResponse<T>(
    graphqlQuery: { operationName: string; query: string },
    transform?: any,
    options?: { cacheTimeout?: number; cacheKey?: string }
): Promise<T>;

export function queryAndTransformResponse<T, Y>(
    graphqlQuery: { operationName: string; query: string },
    transform: (value: T) => Y,
    options?: { cacheTimeout?: number; cacheKey?: string }
): Promise<Y>;

export async function queryAndTransformResponse<T, Y>(
    graphqlQuery: { operationName: string; query: string },
    transform?: (value: T) => Y,
    options?: { cacheTimeout?: number; cacheKey?: string }
): Promise<T | Y> {
    const cacheResults = await redisClient.get(graphqlQuery.query);
    if (cacheResults) {
        return JSON.parse(cacheResults);
    }
    const response = await axiosSubgraph.post<SubgraphResponse<T>>('', graphqlQuery);
    const transformedResponse = transform
        ? transform(response.data.data[graphqlQuery.operationName])
        : response.data.data[graphqlQuery.operationName];
    redisClient.set(
        graphqlQuery.query,
        JSON.stringify(transformedResponse),
        'EX',
        options?.cacheTimeout || intervalsInSeconds.oneHour
    );

    return transformedResponse;
}
