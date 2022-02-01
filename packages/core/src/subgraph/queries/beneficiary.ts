import { gql } from 'apollo-boost';

import { client } from '../config';
import { BeneficiarySubgraph } from '../interfaces/beneficiary';

export const getBeneficiaries = async (
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
