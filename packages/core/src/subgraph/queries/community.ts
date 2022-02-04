import { gql } from 'apollo-boost';

import { client } from '../config';

export const getCommunityProposal = async (): Promise<string[]> => {
    try {
        const query = gql`
            {
                communityProposalEntities(first: 100) {
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
