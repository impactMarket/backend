import { gql } from 'apollo-boost';
import { utils } from 'ethers';

import { clientDAO } from '../config';
import { BeneficiarySubgraph } from '../interfaces/beneficiary';

export const getAllBeneficiaries = async (
    community: string
): Promise<BeneficiarySubgraph[]> => {
    try {
        const aMonthAgo = new Date();
        aMonthAgo.setDate(aMonthAgo.getDate() - 30);
        aMonthAgo.setUTCHours(0, 0, 0, 0);
        const first = 1000;
        const result: BeneficiarySubgraph[] = [];

        for (let i = 0; ; i += first) {
            const query = gql`
                {
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
                }
            `;
            const queryResult = await clientDAO.query({
                query,
                fetchPolicy: 'no-cache',
            });

            result.push(...queryResult.data.beneficiaryEntities);

            if (queryResult.data.beneficiaryEntities.length < first) {
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
    orderDirection?: string
): Promise<BeneficiarySubgraph[]> => {
    try {
        const idsFormated = addresses.map((el) => `"${el.toLowerCase()}"`);

        const query = gql`
            {
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
            }
        `;
        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });
        return queryResult.data.beneficiaryEntities;
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
    orderDirection?: string
): Promise<BeneficiarySubgraph[]> => {
    try {
        const query = gql`
            {
                beneficiaryEntities(
                    first: ${limit}
                    skip: ${offset}
                    ${orderBy ? orderBy : ''}
                    ${orderDirection ? orderDirection : ''}
                    where: {
                        community:"${community.toLowerCase()}"
                        ${lastClaimAt ? lastClaimAt : ''}
                        ${state ? state : ''}
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
            }
        `;
        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });
        return queryResult.data.beneficiaryEntities;
    } catch (error) {
        throw new Error(error);
    }
};

export const getBeneficiaryCommunity = async (
    beneficiaryAddress: string
): Promise<string> => {
    try {
        const query = gql`
                {
                    beneficiaryEntity(
                        id: "${beneficiaryAddress.toLowerCase()}"
                        status: 0
                    ) {
                        community {
                            id
                        }
                    }
                }
            `;
        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        return utils.getAddress(
            queryResult.data.beneficiaryEntity.community.id
        );
    } catch (error) {
        throw new Error(error);
    }
};

export const countBeneficiaries = async (
    community: string,
    state?: number
): Promise<number> => {
    try {
        const query = gql`
                {
                    communityEntity(
                        id: "${community.toLowerCase()}"
                    ) {
                        beneficiaries
                        removedBeneficiaries
                    }
                }
            `;
        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        switch (state) {
            case 0:
                return queryResult.data.communityEntity?.beneficiaries;
            case 1:
                return queryResult.data.communityEntity?.removedBeneficiaries;
            case 2:
                return queryResult.data.communityEntity?.lockedBeneficiaries;
            default:
                return (
                    queryResult.data.communityEntity?.beneficiaries +
                    queryResult.data.communityEntity?.removedBeneficiaries +
                    (queryResult.data.communityEntity?.lockedBeneficiaries
                        ? queryResult.data.communityEntity?.lockedBeneficiaries
                        : 0) // TODO: remove "if" when TheGraph updates
                );
        }
    } catch (error) {
        throw new Error(error);
    }
};

export const countBeneficiariesByCommunities = async (
    community: string[],
    state: string
): Promise<number> => {
    try {
        const idsFormated = community.map((el) => `"${el.toLowerCase()}"`);

        const query = gql`
                {
                    communityEntities(
                        address_in: [${idsFormated}]
                    ) {
                        beneficiaries
                        removedBeneficiaries
                    }
                }
            `;
        const queryResult = await clientDAO.query({
            query,
            fetchPolicy: 'no-cache',
        });

        if (state === 'active') {
            return queryResult.data.communityEntities?.beneficiaries;
        } else if (state === 'removed') {
            return queryResult.data.communityEntities?.removedBeneficiaries;
        } else {
            return (
                queryResult.data.communityEntities?.beneficiaries +
                queryResult.data.communityEntities?.removedBeneficiaries
            );
        }
    } catch (error) {
        throw new Error(error);
    }
};
