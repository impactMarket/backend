import { gql } from 'apollo-boost';
import { ethers } from 'ethers';

import config from '../../config';
import { clientDAO, clientCouncil } from '../config';

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
