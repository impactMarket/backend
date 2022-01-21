import { gql } from 'apollo-boost';

import { client } from '../config';

export const getCommunityProposal = async (
    callData: string[]
): Promise<string[]> => {
    try {
        const data = callData.filter(Boolean);
        const callDataFormated = data.map((el) => `"${el}"`);

        const query = gql`
            {
                communityProposalEntities(
                    where: {
                        calldata_in:[${callDataFormated}]
                    }
                ) {
                    calldata
                }
            }
        `;

        const queryResult = await client.query({
            query,
        });

        if (queryResult.data?.communityProposalEntities?.length) {
            return queryResult.data.communityProposalEntities.map(
                (proposal) => proposal.calldata
            );
        }

        return [];
    } catch (error) {
        throw new Error(error);
    }
};
