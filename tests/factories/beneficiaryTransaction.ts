import { ethers } from 'ethers';

import { BeneficiaryAttributes } from '../../src/database/models/ubi/beneficiary';
import {
    BeneficiaryTransaction,
    BeneficiaryTransactionCreationAttributes,
} from '../../src/database/models/ubi/beneficiaryTransaction';
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
    isFromBeneficiary: boolean
) => {
    const randomWallet = ethers.Wallet.createRandom();
    const defaultProps: BeneficiaryTransactionCreationAttributes = {
        amount: '1000000000000000000',
        beneficiary: beneficiary.address,
        isFromBeneficiary,
        withAddress: await randomWallet.getAddress(),
        tx: randomTx(),
        date: new Date(),
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
    isFromBeneficiary: boolean
) => {
    const result = await BeneficiaryTransaction.create(
        await data(beneficiary, isFromBeneficiary)
    );
    return result;
};
export default BeneficiaryTransactionFactory;
