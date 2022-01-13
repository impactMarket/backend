import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import {
    Inflow,
    InflowCreationAttributes,
} from '../../src/database/models/ubi/inflow';
import { CommunityAttributes } from '../../src/interfaces/ubi/community';
import { randomTx } from '../config/utils';
/**
 * Generate an object which container attributes needed
 * to successfully create a user instance.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       An object to build the user from.
 */
const data = async (community: CommunityAttributes) => {
    const randomWallet = ethers.Wallet.createRandom();
    const amount = new BigNumber(community.contract!.claimAmount)
        .multipliedBy(5)
        .toString();
    const defaultProps: InflowCreationAttributes = {
        from: await randomWallet.getAddress(),
        amount,
        contractAddress: community.contractAddress!,
        value: amount,
        tx: randomTx(),
        txAt: new Date(),
    };
    return defaultProps;
};
/**
 * Generates a user instance from the properties provided.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       A user instance
 */
const InflowFactory = async (community: CommunityAttributes) => {
    return Inflow.create(await data(community));
};
export default InflowFactory;
