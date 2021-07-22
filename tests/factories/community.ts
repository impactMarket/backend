import { ethers } from 'ethers';
import faker from 'faker';

import {
    Community,
    CommunityAttributes,
} from '../../src/database/models/ubi/community';
import { UbiCommunityContractModel } from '../../src/database/models/ubi/communityContract';
import { UbiCommunityStateModel } from '../../src/database/models/ubi/communityState';
import {
    UbiCommunityContract,
    UbiCommunityContractCreation,
} from '../../src/interfaces/ubi/ubiCommunityContract';

interface ICreateProps {
    requestByAddress: string;
    started: Date;
    status: 'pending' | 'valid' | 'removed';
    visibility: 'public' | 'private';
    contract: UbiCommunityContractCreation;
    hasAddress?: boolean;
    name?: string;
    country?: string;
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
        country: props.country ? props.country : faker.address.countryCode(),
        currency: faker.finance.currencyCode(),
        description: faker.lorem.sentence(),
        email: faker.internet.email(),
        gps: {
            latitude: 0,
            longitude: 0,
        },
        language: 'pt',
        name: props.name ? props.name : faker.company.companyName(),
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
    const result: CommunityAttributes[] = [];
    for (let index = 0; index < props.length; index++) {
        const newCommunity = await Community.create(await data(props[index]));
        const newContract = await UbiCommunityContractModel.create({
            ...props[index].contract,
            communityId: newCommunity.id,
        });
        result.push({
            ...(newCommunity.toJSON() as CommunityAttributes),
            contract: newContract.toJSON() as UbiCommunityContract,
        });
        await UbiCommunityStateModel.create({ communityId: newCommunity.id });
    }
    return result;
};
export default CommunityFactory;
