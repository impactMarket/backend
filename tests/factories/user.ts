import { ethers } from 'ethers';
import faker from 'faker';

import { AppUserTrustModel } from '../../src/database/models/app/appUserTrust';
import { UserModel } from '../../src/database/models/app/user';
import { User, UserCreationAttributes } from '../../src/interfaces/app/user';
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
    const defaultProps: UserCreationAttributes = {
        address: await randomWallet.getAddress(),
        language: 'pt',
        currency: faker.finance.currencyCode(),
        gender: 'u',
        pushNotificationToken: '',
        suspect: false,
        trust: {
            phone: faker.phone.phoneNumber(),
        },
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
        const newUser: any = await UserModel.create(await data(), {
            include: [
                {
                    model: AppUserTrustModel,
                    as: 'trust',
                },
            ],
        } as any); // use any :facepalm:
        result.push(newUser.toJSON());
    }
    return result;
};
export default UserFactory;
