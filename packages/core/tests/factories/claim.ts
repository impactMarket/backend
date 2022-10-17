import BigNumber from 'bignumber.js';

import config from '../../src/config';
import { UbiClaimModel } from '../../src/database/models/ubi/ubiClaim';
import { BeneficiaryAttributes } from '../../src/interfaces/ubi/beneficiary';
import { CommunityAttributes } from '../../src/interfaces/ubi/community';
import { UbiClaimCreation } from '../../src/interfaces/ubi/ubiClaim';
import { randomTx } from '../config/utils';
/**
 * Generate an object which container attributes needed
 * to successfully create a user instance.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       An object to build the user from.
 */
const data = async (
    beneficiary: BeneficiaryAttributes,
    community: CommunityAttributes
) => {
    const amount = new BigNumber(community.contract!.claimAmount)
        .multipliedBy(10 ** config.cUSDDecimal)
        .toString();
    const defaultProps: UbiClaimCreation = {
        address: beneficiary.address,
        amount,
        communityId: community.id,
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
const ClaimFactory = async (
    beneficiary: BeneficiaryAttributes,
    community: CommunityAttributes
) => {
    return await UbiClaimModel.create(await data(beneficiary, community));
};
export default ClaimFactory;
