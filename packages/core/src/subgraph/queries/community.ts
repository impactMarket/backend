import { getAddress } from '@ethersproject/address';
import { ethers } from 'ethers';

import config from '../../config';
import { redisClient } from '../../database';
import { axiosCouncilSubgraph, axiosSubgraph } from '../config';
import { intervalsInSeconds } from '../../types';

export const getCommunityProposal = async (): Promise<string[]> => {
    try {
        const provider = new ethers.providers.JsonRpcProvider(
            config.jsonRpcUrl
        );
        const blockNumber = await provider.getBlockNumber();

        const graphqlQuery = {
            operationName: 'proposalEntities',
            query: `query proposalEntities {
                proposalEntities(
                    where: {
                        status: 0
                        endBlock_gt: ${blockNumber}
                        signatures_contains:["addCommunity(address[],address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)"]
                    }
                ) {
                    calldatas
                }
            }`,
        };
        const cacheResults = await redisClient.get(graphqlQuery.query);

        if (cacheResults) {
            return JSON.parse(cacheResults);
        }

        const response = await axiosCouncilSubgraph.post<
            any,
            {
                data: {
                    data: {
                        proposalEntities: {
                            calldatas: string[]
                        }[];
                    };
                };
            }
        >('', graphqlQuery);

        const proposalEntities = response.data?.data.proposalEntities;

        redisClient.set(
            graphqlQuery.query,
            JSON.stringify(proposalEntities),
            'EX',
            intervalsInSeconds.oneHour
        );

        return proposalEntities.map(
            (proposal) => proposal.calldatas[0]
        );
    } catch (error) {
        throw new Error(error);
    }
};

export const getClaimed = async (
    ids: string[]
): Promise<
    {
        claimed: string;
        id: string;
    }[]
> => {
    try {
        const idsFormated = ids.map((el) => `"${el.toLowerCase()}"`);
        const graphqlQuery = {
            operationName: 'communityEntities',
            query: `query communityEntities {
                communityEntities(
                    first: ${idsFormated.length}
                    where: {
                        id_in:[${idsFormated}]
                    }
                ) {
                    id
                    claimed
                }
            }`,
            variables: {},
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
                        communityEntities: {
                            id: string,
                            claimed: string,
                        }[];
                    };
                };
            }
        >('', graphqlQuery);
        const communityEntities = response.data?.data.communityEntities;

        redisClient.set(
            graphqlQuery.query,
            JSON.stringify(communityEntities),
            'EX',
            intervalsInSeconds.halfHour
        );

        return communityEntities;
    } catch (error) {
        throw new Error(error);
    }
};

export const getCommunityState = async (
    communityAddress: string
): Promise<{
    claims: number;
    claimed: string;
    beneficiaries: number;
    removedBeneficiaries: number;
    contributed: string;
    contributors: number;
    managers: number;
    baseInterval: number;
    state: number;
}> => {
    try {
        const graphqlQuery = {
            operationName: 'communityEntity',
            query: `query communityEntity {
                communityEntity(
                    id: "${communityAddress.toLowerCase()}"
                ) {
                    claims
                    claimed
                    beneficiaries
                    removedBeneficiaries
                    contributed
                    contributors
                    managers
                    baseInterval
                    estimatedFunds
                    state
                    claimAmount
                    originalClaimAmount
                    maxClaim 
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
                        claims: number,
                        claimed: string,
                        beneficiaries: number,
                        removedBeneficiaries: number,
                        contributed: string,
                        contributors: number,
                        managers: number,
                        baseInterval: number,
                        estimatedFunds: string,
                        state: number,
                        claimAmount: string,
                        originalClaimAmount: string,
                        maxClaim : string,
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
        intervalsInSeconds.halfHour
    );

    return communityEntity;
    } catch (error) {
        throw new Error(error);
    }
};

export const getCommunityUBIParams = async (
    communityAddress: string
): Promise<{
    claimAmount: string;
    maxClaim: string;
    baseInterval: number;
    incrementInterval: number;
    decreaseStep: string;
    minTranche: string;
    maxTranche: string;
}> => {
    try {
        const graphqlQuery = {
            operationName: 'communityEntity',
            query: `query communityEntity {
                communityEntity(
                    id: "${communityAddress.toLowerCase()}"
                ) {
                    claimAmount
                    maxClaim
                    baseInterval
                    incrementInterval
                    decreaseStep
                    minTranche
                    maxTranche
                }
            }`,
            variables: {},
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
                            claimAmount: string,
                            maxClaim: string,
                            baseInterval: number,
                            incrementInterval: number,
                            decreaseStep: string,
                            minTranche: string,
                            maxTranche: string,
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
            intervalsInSeconds.halfHour
        );

        return communityEntity;
    } catch (error) {
        throw new Error(error);
    }
};

export const communityEntities = async (where: string, fields: string) => {
    try {
        const graphqlQuery = {
            operationName: 'communityEntities',
            query: `query communityEntities {
                communityEntities(
                    ${where}
                ) {
                    ${fields}
                }
            }`,
            variables: {},
        };
        const cacheResults = await redisClient.get(graphqlQuery.query);
    
        if (cacheResults) {
            return JSON.parse(cacheResults);
        }

        const response = await axiosSubgraph.post('', graphqlQuery);
        const communityEntities = response.data?.data.communityEntities;

        redisClient.set(
            graphqlQuery.query,
            JSON.stringify(communityEntities),
            'EX',
            intervalsInSeconds.halfHour
        );

        return communityEntities;
    } catch (error) {
        throw new Error(error);
    }
};

export const getBiggestCommunities = async (
    limit: number,
    offset: number,
    orderDirection?: string
) => {
    const graphqlQuery = {
        operationName: 'fetchCommunities',
        query: `query fetchCommunities {
            communityEntities(
                first: ${limit}
                skip: ${offset}
                orderBy: beneficiaries
                orderDirection: ${orderDirection ? orderDirection : 'desc'}
            ) {
                id
                beneficiaries
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
                    communityEntities: {
                        beneficiaries: number;
                        id: string;
                    }[];
                };
            };
        }
    >('', graphqlQuery);
    const communities = response.data?.data.communityEntities;

    redisClient.set(
        graphqlQuery.query,
        JSON.stringify(communities),
        'EX',
        intervalsInSeconds.halfHour
    );

    return communities;
};

export const getCommunityAmbassador = async (community: string) => {
    const graphqlQuery = {
        operationName: 'fetchCommunityAmbassador',
        query: `query fetchCommunityAmbassador {
            ambassadorEntities(
                where:{
                    communities_contains: ["${community.toLowerCase()}"]
                }
            ) {
                id
                since
                status
                until
            }
        }`,
        variables: {},
    };
    const cacheResults = await redisClient.get(graphqlQuery.query);

    if (cacheResults) {
        return JSON.parse(cacheResults);
    }

    const response = await axiosCouncilSubgraph.post('', graphqlQuery);
    const ambassador = response.data?.data.ambassadorEntities[0];

    redisClient.set(
        graphqlQuery.query,
        JSON.stringify(ambassador),
        'EX',
        intervalsInSeconds.sixHours
    );

    return ambassador;
};

export const getAmbassadorByAddress = async (ambassadorAddress: string) => {
    try {
        const graphqlQuery = {
            operationName: 'ambassadorEntities',
            query: `query ambassadorEntities {
                ambassadorEntities(
                    where:{
                        id: "${ambassadorAddress.toLowerCase()}"
                        status: 0
                    }
                ) {
                    id
                    communities
                }
            }`,
            variables: {},
        };
        const cacheResults = await redisClient.get(graphqlQuery.query);
    
        if (cacheResults) {
            return JSON.parse(cacheResults);
        }

        const response = await axiosCouncilSubgraph.post<
            any,
            {
                data: {
                    data: {
                        ambassadorEntities: {
                            id: string,
                            communities: string[]
                        }[];
                    };
                };
            }
        >('', graphqlQuery);
        const ambassadorEntities = response.data?.data.ambassadorEntities[0];

        redisClient.set(
            graphqlQuery.query,
            JSON.stringify(ambassadorEntities),
            'EX',
            intervalsInSeconds.sixHours
        );

        return ambassadorEntities;
    } catch (error) {
        throw new Error(error);
    }
};

export const getCommunityStateByAddresses = async (
    addresses: string[]
): Promise<
    {
        beneficiaries: number;
        maxClaim: string;
        id: string;
    }[]
> => {
    const idsFormated = addresses.map((el) => `"${el.toLowerCase()}"`);

    try {
        const graphqlQuery = {
            operationName: 'communityEntities',
            query: `query communityEntities {
                communityEntities(
                    where: {
                        id_in:[${idsFormated}]
                    }
                ) {
                    id
                    beneficiaries
                    maxClaim
                }
            }`,
            variables: {},
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
                        communityEntities: {
                            id: string,
                            beneficiaries: number,
                            maxClaim: string,
                        }[];
                    };
                };
            }
        >('', graphqlQuery);
        const communityEntities = response.data?.data.communityEntities;

        redisClient.set(
            graphqlQuery.query,
            JSON.stringify(communityEntities),
            'EX',
            intervalsInSeconds.oneHour
        );

        return communityEntities;
    } catch (error) {
        throw new Error(error);
    }
};

export const getCommunityDailyState = async (
    where: string
): Promise<
    {
        claims: number;
        claimed: number;
        beneficiaries: number;
        contributed: number;
        contributors: number;
        contractAddress: string;
        volume: string;
        transactions: number;
        reach: number;
        fundingRate: string;
    }[]
> => {
    try {
        const graphqlQuery = {
            operationName: 'communityDailyEntities',
            query: `query communityDailyEntities {
                communityDailyEntities(
                    first: 1000
                    where: {
                        ${where}
                    }
                ) {
                    claims
                    claimed
                    beneficiaries
                    community {
                        id
                    }
                    contributed
    		        contributors
                    transactions
                    reach
                    volume
                    fundingRate
                }
            }`,
            variables: {},
        };
        
        const response = await axiosSubgraph.post<
            any,
            {
                data: {
                    data: {
                        communityDailyEntities: {
                            claims: number,
                            claimed: string,
                            beneficiaries: number,
                            community: {
                                id: string,
                            },
                            contributed: string,
                            contributors: number,
                            transactions: number,
                            reach: number,
                            volume: string,
                            fundingRate: string,
                        }[];
                    };
                };
            }
        >('', graphqlQuery);
        const communityDailyEntities = response.data?.data.communityDailyEntities;

        return communityDailyEntities.map((daily) => ({
            claims: daily.claims,
            claimed: Number(daily.claimed),
            beneficiaries: daily.beneficiaries,
            contributed: Number(daily.contributed),
            contributors: daily.contributors,
            contractAddress: getAddress(daily.community.id),
            transactions: daily.transactions,
            reach: daily.reach,
            volume: daily.volume,
            fundingRate: daily.fundingRate,
        }));
    } catch (error) {
        throw new Error(error);
    }
};
