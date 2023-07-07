import { ethers } from 'ethers';
import { faker } from '@faker-js/faker';

import { Community } from '../../src/database/models/ubi/community';
import { CommunityAttributes } from '../../src/interfaces/ubi/community';
import { UbiCommunityContract, UbiCommunityContractCreation } from '../../src/interfaces/ubi/ubiCommunityContract';
import { UbiCommunityContractModel } from '../../src/database/models/ubi/communityContract';
import { UbiCommunitySuspectModel } from '../../src/database/models/ubi/ubiCommunitySuspect';

interface ICreateProps {
    requestByAddress: string;
    started?: Date;
    status?: 'pending' | 'valid' | 'removed';
    visibility?: 'public' | 'private';
    contract?: UbiCommunityContractCreation;
    hasAddress?: boolean;
    name?: string;
    country?: string;
    gps?: {
        latitude: number;
        longitude: number;
    };
    suspect?: {
        percentage: number;
        suspect: number;
    };
    proposalId?: number;
    ambassadorAddress?: string;
}
/**
 * Generate an object which container attributes needed
 * to successfully create a user instance.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       An object to build the user from.
 */
const data = async (props: ICreateProps) => {
    let defaultProps: any /* CommunityCreationAttributes */ = {
        city: faker.location.city(),
        country: props.country ? props.country : faker.location.countryCode(),
        currency: faker.finance.currencyCode(),
        description: faker.lorem.sentence(),
        email: faker.internet.email(),
        gps: props.gps
            ? props.gps
            : {
                  latitude: 0,
                  longitude: 0
              },
        language: 'pt',
        name: props.name ? props.name : faker.company.name(),
        coverMediaPath: 'cover/image.jpg',
        started: props.started ? props.started : new Date(),
        status: props.status ? props.status : 'valid',
        visibility: props.visibility ? props.visibility : 'public',
        contract: props.contract
            ? props.contract
            : {
                  baseInterval: 60 * 60 * 24,
                  claimAmount: 1,
                  communityId: 0,
                  incrementInterval: 5 * 60,
                  maxClaim: 450,
                  decreaseStep: 1
              },
        ...props
    };
    if (props.hasAddress) {
        const randomWallet = ethers.Wallet.createRandom();
        defaultProps = {
            ...defaultProps,
            contractAddress: await randomWallet.getAddress()
        };
    }
    return defaultProps;
};
/**
 * Generates a user instance from the properties provided.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       A user instance
 */
const CommunityFactory = async (props: ICreateProps[]) => {
    const result: CommunityAttributes[] = [];
    for (let index = 0; index < props.length; index++) {
        const communityData = await data(props[index]);
        const newCommunity = await Community.create(communityData);
        const newContract = await UbiCommunityContractModel.create({
            ...(props[index].contract ? props[index].contract : communityData.contract),
            communityId: newCommunity.id
        });
        result.push({
            ...(newCommunity.toJSON() as CommunityAttributes),
            contract: newContract.toJSON() as UbiCommunityContract
        });
        if (props[index].suspect !== undefined) {
            await UbiCommunitySuspectModel.create({
                communityId: newCommunity.id,
                ...props[index].suspect!
            });
        }
    }
    return result;
};
export default CommunityFactory;
