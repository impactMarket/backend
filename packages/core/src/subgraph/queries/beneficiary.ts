import { utils } from 'ethers';

import { BeneficiarySubgraph } from '../interfaces/beneficiary';
import { axiosSubgraph } from '../config';
import { intervalsInSeconds } from '../../types';
import { redisClient } from '../../database';

export const getAllBeneficiaries = async (community: string): Promise<BeneficiarySubgraph[]> => {
    try {
        const aMonthAgo = new Date();
        aMonthAgo.setDate(aMonthAgo.getDate() - 30);
        aMonthAgo.setUTCHours(0, 0, 0, 0);
        const first = 1000;
        const result: BeneficiarySubgraph[] = [];

        for (let i = 0; ; i += first) {
            const graphqlQuery = {
                operationName: 'beneficiaryEntities',
                query: `query beneficiaryEntities {
                    beneficiaryEntities(
                        first: ${first}
                        skip: ${i}
                        where: {
                            community:"${community.toLowerCase()}"
                            claims_gt: 1
                            lastClaimAt_gte: ${aMonthAgo.getTime() / 1000}
                        }
                    ) {
                        address
                        lastClaimAt
                        preLastClaimAt
                        claims
                        community {
                            id
                        }
                    }
                }`
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
                            beneficiaryEntities: {
                                address: string;
                                lastClaimAt: number;
                                preLastClaimAt: number;
                                claims: number;
                                community: {
                                    id: string;
                                };
                            }[];
                        };
                    };
                }
            >('', graphqlQuery);

            const beneficiaryEntities = response.data?.data.beneficiaryEntities;

            redisClient.set(graphqlQuery.query, JSON.stringify(beneficiaryEntities), 'EX', intervalsInSeconds.oneHour);

            result.push(...beneficiaryEntities);

            if (beneficiaryEntities.length < first) {
                break;
            }
        }
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

export const getBeneficiariesByAddress = async (
    addresses: string[],
    state?: string,
    inactive?: string,
    community?: string,
    orderBy?: string,
    orderDirection?: string,
    lastActivity?: number,
): Promise<BeneficiarySubgraph[]> => {
    try {
        const idsFormated = addresses.map(el => `"${el.toLowerCase()}"`);
        const graphqlQuery = {
            operationName: 'beneficiaryEntities',
            query: `query beneficiaryEntities {
                beneficiaryEntities(
                    first: ${idsFormated.length}
                    ${orderBy ? orderBy : ''}
                    ${orderDirection ? orderDirection : ''}
                    where: {
                        address_in: [${idsFormated}]
                        ${state ? state : ''}
                        ${inactive ? inactive : ''}
                        ${
                            community
                                ? `community: "${community.toLowerCase()}"`
                                : ''
                        }
                        ${lastActivity ? `lastActivity_lt: ${lastActivity}` : ''}
                    }
                ) {
                    address
                    claimed
                    since
                    state
                    community {
                        id
                    }
                }
            }`
        };

        const response = await axiosSubgraph.post<
            any,
            {
                data: {
                    data: {
                        beneficiaryEntities: {
                            address: string;
                            claimed: string;
                            since: number;
                            state: number;
                            community: {
                                id: string;
                            };
                        }[];
                    };
                };
            }
        >('', graphqlQuery);

        const beneficiaryEntities = response.data?.data.beneficiaryEntities;

        return beneficiaryEntities;
    } catch (error) {
        throw new Error(error);
    }
};

export const getBeneficiaries = async (
    community: string,
    limit: number,
    offset: number,
    lastClaimAt?: string,
    state?: string,
    orderBy?: string,
    orderDirection?: string,
    lastActivity?: number,
): Promise<BeneficiarySubgraph[]> => {
    try {
        const graphqlQuery = {
            operationName: 'beneficiaryEntities',
            query: `query beneficiaryEntities {
                beneficiaryEntities(
                    first: ${limit}
                    skip: ${offset}
                    ${orderBy ? orderBy : ''}
                    ${orderDirection ? orderDirection : ''}
                    where: {
                        community:"${community.toLowerCase()}"
                        ${lastClaimAt ? lastClaimAt : ''}
                        ${state ? state : ''}
                        ${lastActivity ? `lastActivity_lt: ${lastActivity}` : ''}
                    }
                ) {
                    address
                    claimed
                    since
                    state
                    community {
                        id
                    }
                }
            }`
        };

        const response = await axiosSubgraph.post<
            any,
            {
                data: {
                    data: {
                        beneficiaryEntities: {
                            address: string;
                            claimed: string;
                            since: number;
                            state: number;
                            community: {
                                id: string;
                            };
                        }[];
                    };
                };
            }
        >('', graphqlQuery);

        const beneficiaryEntities = response.data?.data.beneficiaryEntities;

        return beneficiaryEntities;
    } catch (error) {
        throw new Error(error);
    }
};

export const getBeneficiaryCommunity = async (beneficiaryAddress: string): Promise<string> => {
    try {
        const graphqlQuery = {
            operationName: 'beneficiaryEntity',
            query: `query beneficiaryEntity {
                beneficiaryEntity(
                    id: "${beneficiaryAddress.toLowerCase()}"
                    status: 0
                ) {
                    community {
                        id
                    }
                }
            }`
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
                        beneficiaryEntity: {
                            community: {
                                id: string;
                            };
                        };
                    };
                };
            }
        >('', graphqlQuery);

        const beneficiaryEntity = response.data?.data.beneficiaryEntity;

        redisClient.set(graphqlQuery.query, JSON.stringify(beneficiaryEntity), 'EX', intervalsInSeconds.oneHour);

        return utils.getAddress(beneficiaryEntity.community.id);
    } catch (error) {
        throw new Error(error);
    }
};

export const countBeneficiaries = async (community: string, state?: number): Promise<number> => {
    try {
        const graphqlQuery = {
            operationName: 'communityEntity',
            query: `query communityEntity {
                communityEntity(
                    id: "${community.toLowerCase()}"
                ) {
                    beneficiaries
                    removedBeneficiaries
                    lockedBeneficiaries
                }
            }`
        };

        const response = await axiosSubgraph.post<
            any,
            {
                data: {
                    data: {
                        communityEntity: {
                            beneficiaries: number;
                            removedBeneficiaries: number;
                            lockedBeneficiaries: number;
                        };
                    };
                };
            }
        >('', graphqlQuery);

        const communityEntity = response.data?.data.communityEntity;

        switch (state) {
            case 0:
                return communityEntity?.beneficiaries;
            case 1:
                return communityEntity?.removedBeneficiaries;
            case 2:
                return communityEntity?.lockedBeneficiaries;
            default:
                return (
                    communityEntity?.beneficiaries +
                    communityEntity?.removedBeneficiaries +
                    communityEntity?.lockedBeneficiaries
                );
        }
    } catch (error) {
        throw new Error(error);
    }
};

export const countInactiveBeneficiaries = async (
    community: string,
    lastActivity: number
): Promise<number> => {
    try {
        const graphqlQuery = {
            operationName: 'beneficiaryEntities',
            query: `query beneficiaryEntities {
                beneficiaryEntities(
                    where: {
                        community:"${community.toLowerCase()}"
                        lastActivity_lt: ${lastActivity}
                        state: 0
                    }
                ) {
                    address
                }
            }`,
        };

        const response = await axiosSubgraph.post<
            any,
            {
                data: {
                    data: {
                        beneficiaryEntities: {
                            address: string,
                            claimed: string,
                            since: number,
                            state: number,
                            community: {
                                id: string,
                            }
                        }[];
                    };
                };
            }
        >('', graphqlQuery);

        const beneficiaryEntities = response.data?.data.beneficiaryEntities;

        return beneficiaryEntities.length;
    } catch (error) {
        throw new Error(error);
    }
}
