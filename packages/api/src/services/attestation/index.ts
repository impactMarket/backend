import { OdisUtils } from '@celo/identity';
import {
    AuthSigner,
    AuthenticationMethod,
    OdisContextName,
} from '@celo/identity/lib/odis/query';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { parseEther } from '@ethersproject/units';
import { Wallet } from '@ethersproject/wallet';
import { database } from '@impactmarket/core';
import { Op } from 'sequelize';
import twilio from 'twilio';

import config from '../../config';
import erc20ABI from './erc20ABI.json';
import odisABI from './odisABI.json';

interface IOdisPaymentsContract extends Contract {
    payInCUSD(account: string, value: BigNumber): Promise<TransactionResponse>;
}
interface IERC20Contract extends Contract {
    increaseAllowance(
        spender: string,
        value: BigNumber
    ): Promise<TransactionResponse>;
}

/**
 * Top up ODIS quota
 * @see https://docs.celo.org/protocol/identity/odis
 * @param issuer issuer wallet
 */
const topUpOdis = async (issuer: Wallet) => {
    const odisPaymentsContract = new Contract(
        config.attestations.odisProxy,
        odisABI,
        issuer
    ) as IOdisPaymentsContract;
    const stableTokenContract = new Contract(
        config.cUSDContractAddress,
        erc20ABI,
        issuer
    ) as IERC20Contract;

    // give odis payment contract permission to use cUSD
    const currentAllowance = await stableTokenContract.allowance(
        issuer.address,
        odisPaymentsContract.address
    );
    console.log('current allowance:', currentAllowance.toString());
    let enoughAllowance: boolean = false;

    const ONE_CENT_CUSD_WEI = parseEther('0.01');

    if (ONE_CENT_CUSD_WEI.gt(currentAllowance)) {
        const approvalTxReceipt = await stableTokenContract.increaseAllowance(
            odisPaymentsContract.address,
            ONE_CENT_CUSD_WEI
        );
        const tx = await approvalTxReceipt.wait();
        console.log('cusd approval tx hash:', tx.transactionHash);
        enoughAllowance = tx.status === 1;
    } else {
        enoughAllowance = true;
    }

    // increase quota
    if (enoughAllowance) {
        const odisPayment = await odisPaymentsContract.payInCUSD(
            issuer.address,
            ONE_CENT_CUSD_WEI
        );
        const tx = await odisPayment.wait();
        console.log('odis payment tx hash:', tx.transactionHash);
    } else {
        // throw Error('cUSD approval failed');
    }
    // finishing top up odis quota
};

/**
 * Validate code and return obfuscated identifier
 * @param phoneNumber phone number to verify
 * @param type validation type (no usage yet)
 * @param code code to verify
 * @param userId user id doing the verification
 * @returns the obfuscated identifier
 */
export const verify = async (
    phoneNumber: string,
    _type: number,
    code: string,
    userId: number
) => {
    // check if code exists and is valid
    const validCode = await database.models.appUserValidationCode.findOne({
        attributes: ['id'],
        where: {
            code: code.toString(),
            userId,
            expiresAt: { [Op.lte]: Date.now() },
        },
    });

    if (!validCode) {
        throw Error('Invalid or expired code');
    }

    // initiate odis request
    const issuer = new Wallet(
        config.attestations.issuerPrivateKey,
        new JsonRpcProvider(config.chain.jsonRPCUrlCelo)
    );
    const authSigner: AuthSigner = {
        authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
        rawKey: config.attestations.dekPrivateKey,
    };
    const serviceContext = OdisUtils.Query.getServiceContext(
        config.chain.isMainnet
            ? OdisContextName.MAINNET
            : OdisContextName.ALFAJORES
    );
    const { remainingQuota } = await OdisUtils.Quota.getPnpQuotaStatus(
        issuer.address,
        authSigner,
        serviceContext
    );

    if (remainingQuota < 1) {
        await topUpOdis(issuer);
    }

    const { obfuscatedIdentifier } =
        await OdisUtils.Identifier.getObfuscatedIdentifier(
            phoneNumber,
            OdisUtils.Identifier.IdentifierPrefix.PHONE_NUMBER,
            issuer.address,
            authSigner,
            serviceContext
        );

    // remove code from db
    await database.models.appUserValidationCode.destroy({
        where: { id: validCode.id },
    });

    return obfuscatedIdentifier;
};

/**
 * Send verification code to phone number
 * @param phoneNumber phone number to send code to
 * @param type validation type
 * @param userId user id doing the verification
 * @returns void
 */
export const send = async (
    phoneNumber: string,
    type: number,
    userId: number
) => {
    const { accountSid, authToken, fromNumber } = config.twilio;
    const client = twilio(accountSid, authToken);
    // random 4 digit code
    const code = Math.floor(Math.random() * (9999 - 1000) + 1000);
    // save code to db
    await database.models.appUserValidationCode.create({
        code: code.toString(),
        userId,
        type,
        expiresAt: new Date(Date.now() + 1000 * 60 * 25),
    });

    // TODO: add message per language
    client.messages
        .create({
            body: 'Your Libera verification code is: ' + code,
            from: fromNumber,
            to: phoneNumber,
        })
        .catch(console.log);

    return true;
};
