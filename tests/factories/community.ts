import { ethers } from 'ethers';
import faker from 'faker';

import {
    Community,
    // CommunityAttributes,
    // CommunityCreationAttributes,
} from '../../src/database/models/ubi/community';
import { UbiCommunityContractModel } from '../../src/database/models/ubi/communityContract';
import { UbiCommunityStateModel } from '../../src/database/models/ubi/communityState';
import { UbiCommunityContractCreation } from '../../src/interfaces/ubi/ubiCommunityContract';

interface ICreateProps {
    requestByAddress: string;
    started: Date;
    status: 'pending' | 'valid' | 'removed';
    visibility: 'public' | 'private';
    contract: UbiCommunityContractCreation;
    hasAddress?: boolean;
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
    let defaultProps: any /*CommunityCreationAttributes */ = {
        city: faker.address.city(),
        country: faker.address.countryCode(),
        currency: faker.finance.currencyCode(),
        description: faker.lorem.sentence(),
        email: faker.internet.email(),
        gps: {
            latitude: 0,
            longitude: 0,
        },
        language: 'pt',
        name: faker.company.companyName(),
        coverMediaId: 0,
        ...props,
    };
    if (props.hasAddress) {
        const randomWallet = ethers.Wallet.createRandom();
        defaultProps = {
            ...defaultProps,
            contractAddress: await randomWallet.getAddress(),
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
    const result: any /*CommunityAttributes*/[] = [];
    for (let index = 0; index < props.length; index++) {
        const newCommunity = await Community.create(await data(props[index]));
        result.push(newCommunity.toJSON());
        await UbiCommunityContractModel.create({
            ...props[index].contract,
            communityId: newCommunity.id,
        });
        await UbiCommunityStateModel.create({ communityId: newCommunity.id });
    }
    return result;
};
export default CommunityFactory;
