import { BeneficiaryAttributes } from '../../src/database/models/ubi/beneficiary';
import {
    Claim,
    ClaimCreationAttributes,
} from '../../src/database/models/ubi/claim';
import { CommunityAttributes } from '../../src/database/models/ubi/community';
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
    const defaultProps: ClaimCreationAttributes = {
        address: beneficiary.address,
        amount: community.contract!.claimAmount,
        communityId: community.publicId,
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
    return await Claim.create(await data(beneficiary, community));
};
export default ClaimFactory;
