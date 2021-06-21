import { UbiCommunityDailyStateModel } from '../../src/database/models/ubi/communityDailyState';
import { UbiCommunityDailyStateCreation } from '../../src/interfaces/ubi/ubiCommunityDailyState';

/**
 * Generates a user instance from the properties provided.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       A user instance
 */
const UbiCommunityDailyStateFactory = async (
    props: UbiCommunityDailyStateCreation[]
) => {
    await UbiCommunityDailyStateModel.bulkCreate(props);
};
export default UbiCommunityDailyStateFactory;
