import { Wallet } from 'ethers';
import { faker } from '@faker-js/faker';

import { AppUserModel } from '../../src/database/models/app/appUser';
import {
    AppUser,
    AppUserCreationAttributes,
} from '../../src/interfaces/app/appUser';

interface ICreateProps {
    phone?: string;
    suspect?: boolean;
    active?: boolean;
    gender?: string;
    year?: number;
}
/**
 * Generate an object which container attributes needed
 * to successfully create a user instance.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       An object to build the user from.
 */
const data = async (props?: ICreateProps) => {
    const randomWallet = Wallet.createRandom();
    const defaultProps: AppUserCreationAttributes = {
        address: await randomWallet.getAddress(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        language: 'pt',
        currency: faker.finance.currencyCode(),
        gender: props?.gender ? props?.gender : 'u',
        phone: props?.phone ? props.phone : faker.phone.number(),
        active: props?.active,
        year: props?.year,
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
const UserFactory = async (
    options: { n: number; props?: ICreateProps[] } = { n: 1 }
) => {
    const result: AppUser[] = [];
    for (let index = 0; index < options.n; index++) {
        const newUser = (await AppUserModel.create(
            await data(options.props ? options.props[index] : undefined)
        )) as AppUserModel; // use any :facepalm:
        result.push(newUser.toJSON() as AppUser);
    }
    return result;
};
export default UserFactory;
