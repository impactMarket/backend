import { ethers } from 'ethers';

import { UbiBeneficiaryTransactionModel } from '../../src/database/models/ubi/ubiBeneficiaryTransaction';
import { BeneficiaryAttributes } from '../../src/interfaces/ubi/beneficiary';
import { UbiBeneficiaryTransactionCreation } from '../../src/interfaces/ubi/ubiBeneficiaryTransaction';
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
    isFromBeneficiary: boolean,
    options?: {
        withAddress?: string;
        amount?: string;
    }
) => {
    const randomWallet = ethers.Wallet.createRandom();
    const defaultProps: UbiBeneficiaryTransactionCreation = {
        amount:
            options && options.amount ? options.amount : '1000000000000000000',
        beneficiary: beneficiary.address,
        isFromBeneficiary,
        withAddress:
            options && options.withAddress
                ? options.withAddress
                : await randomWallet.getAddress(),
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
const BeneficiaryTransactionFactory = async (
    beneficiary: BeneficiaryAttributes,
    isFromBeneficiary: boolean,
    options?: {
        withAddress?: string;
        amount?: string;
    }
) => {
    const result = await UbiBeneficiaryTransactionModel.create(
        await data(beneficiary, isFromBeneficiary, options)
    );
    return result;
};
export default BeneficiaryTransactionFactory;
