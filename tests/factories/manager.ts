import {
    Manager,
    ManagerAttributes,
    ManagerCreationAttributes,
} from '../../src/database/models/ubi/manager';
import { User } from '../../src/interfaces/app/user';

/**
 * Generate an object which container attributes needed
 * to successfully create a user instance.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       An object to build the user from.
 */
const data = async (user: User, communityId: string) => {
    const defaultProps: ManagerCreationAttributes = {
        address: user.address,
        communityId,
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
const ManagerFactory = async (user: User[], communityId: string) => {
    const result: ManagerAttributes[] = [];
    for (let index = 0; index < user.length; index++) {
        const newBneficiary: any = await Manager.create(
            await data(user[index], communityId)
        );
        result.push(newBneficiary.toJSON());
    }
    return result;
};
export default ManagerFactory;
