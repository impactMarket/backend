import { ethers } from 'ethers';
import faker from 'faker';

import { UserModel } from '../../src/database/models/app/user';
import { User } from '../../src/interfaces/app/user';
/**
 * Generate an object which container attributes needed
 * to successfully create a user instance.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       An object to build the user from.
 */
const data = async () => {
    const randomWallet = ethers.Wallet.createRandom();
    const defaultProps = {
        address: await randomWallet.getAddress(),
        language: 'pt',
        currency: faker.finance.currencyCode(),
        gender: 'u',
        pushNotificationToken: '',
        lastLogin: new Date(),
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
const UserFactory = async (options: { n: number } = { n: 1 }) => {
    const result: User[] = [];
    for (let index = 0; index < options.n; index++) {
        result.push(await UserModel.create(await data()));
    }
    return result;
};
export default UserFactory;
