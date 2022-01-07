import { UbiClaimModel } from '../../database/models/ubi/ubiClaim';
import { BeneficiaryAttributes } from '../../interfaces/ubi/beneficiary';
import { CommunityAttributes } from '../../interfaces/ubi/community';
import { UbiClaimCreation } from '../../interfaces/ubi/ubiClaim';
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
    const defaultProps: UbiClaimCreation = {
        address: beneficiary.address,
        amount: community.contract!.claimAmount,
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
