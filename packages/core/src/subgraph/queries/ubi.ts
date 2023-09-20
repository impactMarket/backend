import { axiosSubgraph } from '../config';
import { hashRedisKey } from './base';
import { intervalsInSeconds } from '../../types';
import { redisClient } from '../../database';

export const getUbiDailyEntity = async (
    where: string
): Promise<
    {
        id: string;
        beneficiaries: number;
        claimed: string;
        claims: number;
        volume: string;
        transactions: number;
        contributed: string;
        contributors: number;
        reach: number;
        fundingRate: string;
    }[]
> => {
    try {
        const graphqlQuery = {
            operationName: 'ubidailyEntities',
            query: `query ubidailyEntities {
                ubidailyEntities(
                    first: 1000
                    where: {
                        ${where}
                    }
                    orderBy: id
                    orderDirection: desc
                ) {
                    id
                    beneficiaries
                    claimed
                    claims
                    volume
                    transactions
                    contributed
                    contributors
                    reach
                    fundingRate
                }
            }`
        };
        const queryHash = hashRedisKey(graphqlQuery.query);
        const cacheResults = await redisClient.get(queryHash);

        if (cacheResults) {
            return JSON.parse(cacheResults);
        }

        const response = await axiosSubgraph.post<
            any,
            {
                data: {
                    data: {
                        ubidailyEntities: {
                            id: string;
                            beneficiaries: number;
                            claimed: string;
                            claims: number;
                            volume: string;
                            transactions: number;
                            contributed: string;
                            contributors: number;
                            reach: number;
                            fundingRate: string;
                        }[];
                    };
                };
            }
        >('', graphqlQuery);

        const ubidailyEntities = response.data?.data.ubidailyEntities;

        redisClient.set(queryHash, JSON.stringify(ubidailyEntities), 'EX', intervalsInSeconds.oneHour);

        return ubidailyEntities;
    } catch (error) {
        throw new Error(error);
    }
};
