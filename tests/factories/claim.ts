import { BeneficiaryAttributes } from '../../src/database/models/ubi/beneficiary';
import { CommunityAttributes } from '../../src/database/models/ubi/community';
import { UbiClaimCreation } from '../../src/interfaces/ubi/ubiClaim';
import ClaimService from '../../src/services/ubi/claim';
import { randomTx } from '../utils/utils';
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
    return ClaimService.add(await data(beneficiary, community));
};
export default ClaimFactory;
