import { getAddress } from '@ethersproject/address';
import { gql } from 'apollo-boost';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { ethers } from 'ethers';

import config from '../../config';
import { redisClient } from '../../database';
import { clientDAO, clientCouncil } from '../config';

const intervalsInSeconds = {
    halfHour: 1800,
    oneHour: 3600,
    sixHours: 21600,
    twelveHours: 43200,
    oneDay: 86400,
};

function axiosInit() {
    const axiosSubgraph = axios.create({
        baseURL: config.subgraphUrl,
        headers: {
            'content-type': 'application/json',
        },
        timeout: 4000,
    });
    const axiosCouncilSubgraph = axios.create({
        baseURL: config.councilSubgraphUrl,
        headers: {
            'content-type': 'application/json',
        },
        timeout: 4000,
    });
    axiosRetry(axiosSubgraph, {
        retries: 3,
        retryDelay: axiosRetry.exponentialDelay,
    });
    axiosRetry(axiosCouncilSubgraph, {
        retries: 3,
        retryDelay: axiosRetry.exponentialDelay,
    });

    return { axiosSubgraph, axiosCouncilSubgraph };
}

export const getCommunityProposal = async (): Promise<string[]> => {
    try {
        const provider = new ethers.providers.JsonRpcProvider(
            config.jsonRpcUrl
        );
        const blockNumber = await provider.getBlockNumber();

        const query = gql`
            {
                proposalEntities(
                where: {
                    status: 0
                    endBlock_gt: ${blockNumber}
                    signatures_contains:["addCommunity(address[],address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)"]
                }
                ) {
                    calldatas
                }
            }
        `;

        const queryResult = await clientCouncil.query({
            query,
            fetchPolicy: 'no-cache',
        });

        if (queryResult.data?.proposalEntities?.length) {
            return queryResult.data.proposalEntities.map(
                (proposal) => proposal.calldatas[0]
            );
        }

        return [];
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

        const query = gql`
            {
                communityEntities(
                    first: ${idsFormated.length}
                    where: {
                        id_in:[${idsFormated}]
                    }
                ) {
                    id
                    claimed
                }
            }
        `;

        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        return queryResult.data.communityEntities;
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
        const query = gql`
            {
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
            }
        `;

        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        return queryResult.data?.communityEntity;
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
}> => {
    try {
        const query = gql`
            {
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
            }
        `;

        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        return queryResult.data?.communityEntity;
    } catch (error) {
        throw new Error(error);
    }
};

export const communityEntities = async (where: string, fields: string) => {
    try {
        const query = gql`
            {
                communityEntities(
                    ${where}
                ) {
                    ${fields}
                }
            }
        `;

        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        return queryResult.data?.communityEntities;
    } catch (error) {
        throw new Error(error);
    }
};

export const getBiggestCommunities = async (
    limit: number,
    offset: number,
    orderDirection?: string
) => {
    const { axiosSubgraph } = axiosInit();
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
    const { axiosCouncilSubgraph } = axiosInit();
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
        const query = gql`
            {
                ambassadorEntities(
                    where:{
                        id: "${ambassadorAddress.toLowerCase()}"
                        status: 0
                    }
                ) {
                    id
                    communities
                }
            }
        `;

        const queryResult = await clientCouncil.query({
            query,
            fetchPolicy: 'no-cache',
        });

        return queryResult.data?.ambassadorEntities[0];
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
        const query = gql`
            {
                communityEntities(
                    where: {
                        id_in:[${idsFormated}]
                    }
                ) {
                    id
                    beneficiaries
                    maxClaim
                }
            }
        `;

        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        return queryResult.data.communityEntities;
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
        const query = gql`
            {
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
            }
        `;

        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        if (queryResult.data?.communityDailyEntities?.length) {
            return queryResult.data.communityDailyEntities.map((daily) => ({
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
        }

        return [];
    } catch (error) {
        throw new Error(error);
    }
};
