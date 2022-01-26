import { gql } from 'apollo-boost';

import { client } from '../config';
import { ethers } from 'ethers';
import config from '../../config';

export const getCommunityProposal = async (): Promise<string[]> => {
    try {
        const provider = new ethers.providers.JsonRpcProvider(
            config.jsonRpcUrl
        );
        const blockNumber = await provider.getBlockNumber();

        const query = gql`
            {
                communityProposalEntities(
                    where: {
                        status: 0
                        endBlock_gt: ${blockNumber}
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

export const getClaimed = async (ids: string[]): Promise<{
    claimed: string;
    id: string;
}[]> => {
    try {
        const idsFormated = ids.map((el) => `"${el.toLocaleLowerCase()}"`);

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

        const queryResult = await client.query({
            query,
        });

        return queryResult.data.communityEntities;
    } catch (error) {
        throw new Error(error);
    }
}