import { AuthSigner, AuthenticationMethod, OdisContextName } from '@celo/identity/lib/odis/query';
import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { OdisUtils } from '@celo/identity';
import { Op } from 'sequelize';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { Wallet } from '@ethersproject/wallet';
import { database, utils } from '@impactmarket/core';
import { parseEther } from '@ethersproject/units';
import { randomBytes, randomInt } from 'crypto';

import { sendEmail } from '../../services/email';
import { sendSMS } from '../sms';
import config from '../../config';
import erc20ABI from './erc20ABI.json';
import federatedAttestationsABI from './federatedAttestationsABI.json';
import odisABI from './odisABI.json';

const { client: prismic } = utils.prismic;
const { locales } = utils;

interface IOdisPaymentsContract extends Contract {
    payInCUSD(account: string, value: BigNumber): Promise<TransactionResponse>;
}
interface IERC20Contract extends Contract {
    increaseAllowance(spender: string, value: BigNumber): Promise<TransactionResponse>;
}

enum AttestationType {
    PHONE_NUMBER = 0,
    EMAIL = 1
}

/**
 * Top up ODIS quota
 * @see https://docs.celo.org/protocol/identity/odis
 * @param issuer issuer wallet
 */
const topUpOdis = async (issuer: Wallet) => {
    const odisPaymentsContract = new Contract(config.attestations.odisProxy, odisABI, issuer) as IOdisPaymentsContract;
    const stableTokenContract = new Contract(config.cUSDContractAddress, erc20ABI, issuer) as IERC20Contract;

    // give odis payment contract permission to use cUSD
    const currentAllowance = await stableTokenContract.allowance(issuer.address, odisPaymentsContract.address);
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
        const odisPayment = await odisPaymentsContract.payInCUSD(issuer.address, ONE_CENT_CUSD_WEI);
        const tx = await odisPayment.wait();
        console.log('odis payment tx hash:', tx.transactionHash);
    } else {
        // throw Error('cUSD approval failed');
        // TODO: send internal alert
    }
    // finishing top up odis quota
};

/**
 * Validate code and return obfuscated identifier
 * @param plainTextIdentifier indentifier to verify in plain text
 * @param type validation type
 * @param code code to verify
 * @param userId user id doing the verification
 * @returns the obfuscated identifier
 */
export const verify = async (plainTextIdentifier: string, type: AttestationType, code: string, userId: number) => {
    // check if code exists and is valid
    // TODO: create startup process to delete expired codes
    const { gt } = Op;
    const validCode = await database.models.appUserValidationCode.findOne({
        attributes: ['id'],
        where: {
            code,
            userId,
            // lol, using Op.gt gives typescript error after sequelize >6.29.0
            expiresAt: { [gt]: Date.now() }
        }
    });

    if (!validCode) {
        throw Error('Invalid or expired code');
    }

    // initiate odis request
    const issuer = new Wallet(config.attestations.issuerPrivateKey, new JsonRpcProvider(config.chain.jsonRPCUrlCelo));
    const authSigner: AuthSigner = {
        authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
        rawKey: config.attestations.dekPrivateKey
    };
    const serviceContext = OdisUtils.Query.getServiceContext(
        config.chain.isMainnet ? OdisContextName.MAINNET : OdisContextName.ALFAJORES
    );

    // TODO: improve this to prevent calling it every time
    OdisUtils.Quota.getPnpQuotaStatus(issuer.address, authSigner, serviceContext).then(({ remainingQuota }) => {
        if (remainingQuota < 2) {
            topUpOdis(issuer);
            // TODO: check balance and send email to admin
        }
    });

    const { PHONE_NUMBER, EMAIL } = OdisUtils.Identifier.IdentifierPrefix;

    const [{ obfuscatedIdentifier }] = await Promise.all([
        OdisUtils.Identifier.getObfuscatedIdentifier(
            plainTextIdentifier,
            type === AttestationType.PHONE_NUMBER ? PHONE_NUMBER : EMAIL,
            issuer.address,
            authSigner,
            serviceContext
        ),
        database.models.appUserValidationCode.destroy({
            where: { id: validCode.id }
        })
    ]);

    if (type === AttestationType.PHONE_NUMBER) {
        await database.models.appUser.update(
            {
                phoneValidated: true
            },
            { where: { id: userId } }
        );
    } else if (type === AttestationType.EMAIL) {
        await database.models.appUser.update(
            {
                emailValidated: true
            },
            { where: { id: userId } }
        );
    }

    return obfuscatedIdentifier;
};

/**
 * Send verification code to identifier
 * @param plainTextIdentifier identifier to send code to in plain text
 * @param type validation type
 * @param userId user id doing the verification
 * @returns void
 */
export const send = async (plainTextIdentifier: string, type: AttestationType, userId: number) => {
    let code = '';

    const user = await database.models.appUser.findOne({
        attributes: ['language'],
        where: { id: userId }
    });
    const locale = locales.find(({ shortCode }) => user?.language.toLowerCase() === shortCode.toLowerCase())?.code;
    if (type === AttestationType.PHONE_NUMBER) {
        code = randomInt(1000, 9999).toString();

        const response = await prismic.getAllByType('push_notifications_data', {
            lang: locale || 'en-US'
        });
        let smsPhoneValidationMessage: string | undefined;
        if (response.length > 0) {
            const data = response[0].data;
            smsPhoneValidationMessage = data['sms-phone-validation-message'];
        }
        if (!smsPhoneValidationMessage) {
            const response = await prismic.getAllByType('push_notifications_data', {
                lang: 'en-US'
            });
            const data = response[0].data;
            smsPhoneValidationMessage = data['sms-phone-validation-message'];
        }
        const body = smsPhoneValidationMessage!.replace('{{code}}', code);

        sendSMS(plainTextIdentifier, body);

        await database.models.appUser.update(
            {
                phone: plainTextIdentifier
            },
            { where: { id: userId } }
        );
    } else if (type === AttestationType.EMAIL) {
        code = randomBytes(4).toString('hex');

        const response = await prismic.getAllByType('push_notifications_data', {
            lang: locale || 'en-US'
        });
        let emailValidationSubject: string | undefined;
        let emailValidationBody: string | undefined;
        if (response.length > 0) {
            const data = response[0].data;
            emailValidationSubject = data['email-validation-message-subject'];
            emailValidationBody = data['email-validation-message-body'];
        }
        if (!emailValidationSubject || !emailValidationBody) {
            const response = await prismic.getAllByType('push_notifications_data', {
                lang: 'en-US'
            });
            const data = response[0].data;
            emailValidationSubject = data['email-validation-message-subject'];
            emailValidationBody = data['email-validation-message-body'];
        }
        const body = emailValidationBody!.replace('{{code}}', code);

        sendEmail({
            to: plainTextIdentifier,
            // TODO: move to env
            from: 'no-reply@impactmarket.com',
            subject: emailValidationSubject,
            text: body
        });

        await database.models.appUser.update(
            {
                email: plainTextIdentifier
            },
            { where: { id: userId } }
        );
    }

    // save code to db
    await database.models.appUserValidationCode.create({
        code,
        userId,
        type,
        expiresAt: new Date(Date.now() + 1000 * 60 * 25)
    });

    return true;
};

/**
 * Lookup if user has attestation by issuer
 * @param userAddress user address to lookup
 * @param issuer issuer address to use for lookup
 * @returns boolean indicating if user has attestation by that issuer
 */
export const lookup = async (userAddress: string, issuer: string) => {
    const provider = new JsonRpcProvider(config.chain.jsonRPCUrlCelo);
    const federatedAttestationsContract = new Contract(
        config.attestations.federatedAttestations,
        federatedAttestationsABI,
        provider
    );
    const attestations = await federatedAttestationsContract.lookupIdentifiers(userAddress, [issuer]);

    return attestations.identifiers.length > 0;
};
