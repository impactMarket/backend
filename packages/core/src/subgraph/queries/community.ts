import { gql } from 'apollo-boost';
import { ethers } from 'ethers';

import config from '../../config';
import { client } from '../config';

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

export const getClaimed = async (
    ids: string[]
): Promise<
    {
        claimed: string;
        id: string;
    }[]
> => {
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
};

export const getCommunityManagers = async (
    communityAddress: string
): Promise<
    {
        address: string;
        state: number;
        added: number;
        removed: number;
        since: number;
    }[]
> => {
    try {
        const query = gql`
            {
                managerEntities(where: {community: "${communityAddress.toLowerCase()}"}) {
                    address
                    state
                    added
                    removed
                    since
                }
            }
        `;

        const queryResult = await client.query({
            query,
        });

        return queryResult.data?.managerEntities;
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
                }
            }
        `;

        const queryResult = await client.query({
            query,
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
                }
            }
        `;

        const queryResult = await client.query({
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

        const queryResult = await client.query({
            query,
            fetchPolicy: 'no-cache',
        });

        return queryResult.data?.communityEntities;
    } catch (error) {
        throw new Error(error);
    }
};
