import {
    Beneficiary,
    BeneficiaryAttributes,
    BeneficiaryCreationAttributes,
} from '../../src/database/models/ubi/beneficiary';
import { User } from '../../src/interfaces/app/user';
import { randomTx } from '../utils/utils';

/**
 * Generate an object which container attributes needed
 * to successfully create a user instance.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       An object to build the user from.
 */
const data = async (user: User, communityId: string) => {
    const defaultProps: BeneficiaryCreationAttributes = {
        address: user.address,
        communityId,
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
const BeneficiaryFactory = async (
    user: User[],
    communityId: string,
    isRemoving: boolean = false
) => {
    const result: BeneficiaryAttributes[] = [];
    if (isRemoving) {
        for (let index = 0; index < user.length; index++) {
            await Beneficiary.update(
                { active: false },
                { where: { address: user[index].address, communityId } }
            );
        }
        return result;
    }
    for (let index = 0; index < user.length; index++) {
        const newBneficiary: any = await Beneficiary.create(
            await data(user[index], communityId)
        );
        result.push(newBneficiary.toJSON());
    }
    return result;
};
export default BeneficiaryFactory;
