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
): Promise<BeneficiarySubgraph[]> => {
    try {
        const idsFormated = addresses.map(
            (el) => `"${el.toLocaleLowerCase()}"`
        );

        const query = gql`
            {
                beneficiaryEntities(
                    first: ${idsFormated.length}
                    where: {
                        address_in: [${idsFormated}]
                        ${state ? state : ''}
                        ${inactive ? inactive : ''}
                        ${community ? `community: "${community.toLocaleLowerCase()}"` : ''}
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
    state?: string
): Promise<BeneficiarySubgraph[]> => {
    try {
        const query = gql`
            {
                beneficiaryEntities(
                    first: ${limit}
                    skip: ${offset}
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
    state: string
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

        if (state === 'active') {
            return queryResult.data.communityEntity.beneficiaries;
        } else if (state === 'removed') {
            return queryResult.data.communityEntity.removedBeneficiaries;
        } else {
            return (
                queryResult.data.communityEntity.beneficiaries +
                queryResult.data.communityEntity.removedBeneficiaries
            );
        }
    } catch (error) {
        throw new Error(error);
    }
};
