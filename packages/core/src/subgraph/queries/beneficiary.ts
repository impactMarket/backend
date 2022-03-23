import { gql } from 'apollo-boost';

import { client } from '../config';
import { BeneficiarySubgraph } from '../interfaces/beneficiary';

export const getBeneficiariesByCommunity = async (
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
            const queryResult = await client.query({
                query,
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
): Promise<BeneficiarySubgraph[]> => {
    try {
        const idsFormated = addresses.map((el) => `"${el.toLocaleLowerCase()}"`);

        const query = gql`
            {
                beneficiaryEntities(
                    where: {
                        address_in: [${idsFormated}]
                    }
                ) {
                    address
                    claimed
                    since
                    community {
                        id
                    }
                }
            }
        `;
        const queryResult = await client.query({
            query,
        });
        return queryResult.data.beneficiaryEntities;
    } catch (error) {
        throw new Error(error);
    }
};

export const getBeneficiariesByClaimInactivity = async (
    timestamp: number,
    community: string,
    limit: number,
    offset: number,
): Promise<BeneficiarySubgraph[]> => {
    try {
        const query = gql`
            {
                beneficiaryEntities(
                    first: ${limit}
                    skip: ${offset}
                    where: {
                        community:"${community.toLowerCase()}",
                        lastClaimAt_lt: ${timestamp}
                    }
                ) {
                    address
                    claimed
                    since
                    community {
                        id
                    }
                }
            }
        `;
        const queryResult = await client.query({
            query,
        });
        return queryResult.data.beneficiaryEntities;
    } catch (error) {
        throw new Error(error);
    }
};
