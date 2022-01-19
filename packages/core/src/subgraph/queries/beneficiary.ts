import { client } from '../config';
import { gql } from 'apollo-boost';
import { BeneficiarySubgraph } from '../../interfaces/ubi/beneficiary';

export const getBeneficiaries = async (communities: string[]): Promise<BeneficiarySubgraph[]> => {
    try {
        const aMonthAgo = new Date();
        aMonthAgo.setDate(aMonthAgo.getDate() - 30);
        aMonthAgo.setUTCHours(0, 0, 0, 0);
        const communitiesFormated = communities.map(el => `"${el.toLowerCase()}"`);
        const first = 1000;
        let result: BeneficiarySubgraph[] = [];

        for (let i = 0; ; i+= first) {
            const query = gql`
                {
                    beneficiaryEntities(
                        first: ${first}
                        skip: ${i}
                        where: {
                            community_in:[${communitiesFormated}]
                            claims_gt: 1
                            lastClaimAt_gte: ${aMonthAgo.getTime()/1000}
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
            `
            const queryResult = await client.query({
                query
            });

            if(!queryResult.data.beneficiaryEntities || !queryResult.data.beneficiaryEntities.length) {
                break;
            }

            result.push(...queryResult.data.beneficiaryEntities)
        }
        return result;
    } catch (error) {
        throw new Error(error);   
    }
}