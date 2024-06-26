// import { database, subgraph } from '@impactmarket/core';
import { Wallet } from '@ethersproject/wallet';
import { arrayify } from '@ethersproject/bytes';
import { database, utils } from '@impactmarket/core';
import { defaultAbiCoder } from '@ethersproject/abi';
import { ethers } from 'ethers';
import { keccak256 } from '@ethersproject/keccak256';
import { randomBytes } from 'crypto';
import BigNumber from 'bignumber.js';
import config from '~config/index';
import referralsLinkABI from './referralLinkABI.json';

// const { getReferralCampaignAndUsages } = subgraph.queries.referrals;
const { appReferralCode, appUser } = database.models;

type ReferralsLinkContract = ethers.Contract & {
    claimReward: (
        _sender: string,
        _campaignIds: string[],
        _newUserAddresses: string[],
        _signatures: string[]
    ) => Promise<ethers.providers.TransactionResponse>;
    campaignReferralLinks: (_campaignId: string, _senderAddress: string) => Promise<BigNumber>;
    campaigns: (_campaignId: number) => Promise<{
        token: string;
        balance: BigNumber;
        state: any;
        startTime: BigNumber;
        endTime: BigNumber;
        rewardAmount: BigNumber;
        maxReferralLinks: BigNumber;
    }>;
};

async function signParams(sender: string, campaignId: number, receiverAddress: string): Promise<string> {
    const wallet = new Wallet(config.signers.referralLink);
    const encoded = defaultAbiCoder.encode(['address', 'uint256', 'address'], [sender, campaignId, receiverAddress]);
    const hash = keccak256(encoded);

    return wallet.signMessage(arrayify(hash));
}

/**
 * Generate a referral code for a user and save to AppReferralCode.
 * @returns referral code
 */
export const generateReferralCode = async () => {
    const referralCode = randomBytes(4).toString('hex');

    const referralCodeExists = await appReferralCode.findOne({
        where: {
            code: referralCode
        }
    });

    if (referralCodeExists) {
        return generateReferralCode();
    }

    return referralCode;
};

export const getCampaignsIllegibility = async (userId: number) => {
    const user = await appUser.findOne({
        where: {
            id: userId
        }
    });

    // for every campaign, the user needs to be registered and have a validated email and phone
    if (!user) {
        throw new utils.BaseError('USER_NOT_FOUND', 'User not found');
    }
    if (!user.phoneValidated || !user.emailValidated) {
        return [];
    }

    // validate wallet onboarding referrals (new users)
    if (user.createdAt > new Date(Date.now() - 60 * 60 * 24 * 60 * 1000)) {
        return [];
    }

    // TODO: remove the following code and use the one in comment
    // once mainnet subgraph is synced!

    if (config.chain.isMainnet) {
        return [0];
    }
    return [1];

    // const campaignsAndUsages = await getReferralCampaignAndUsages(user.address);

    // return campaignsAndUsages.filter(
    //     campaign => campaign.endTime < Date.now() / 1000 && campaign.usages < campaign.maxReferralLinks
    // );
};

/**
 * Get a referral code for a user in AppReferralCode,
 * if the user account has been created an account less that 2 months ago.
 * The referral should be 8 characters long, totally random, and unique. The code should be
 * stored in the database, alongside the campaign and should be associated with the user who created it.
 * It should be possible to use it X times, where X is a number that can be configured.
 */
export const getReferralCode = async (userId: number, campaignId: number) => {
    const user = await appUser.findOne({
        where: {
            id: userId
        }
    });

    if (!user) {
        throw new utils.BaseError('USER_NOT_FOUND', 'User not found');
    }
    if (!user.phoneValidated || !user.emailValidated) {
        throw new utils.BaseError('NOT_ILLEGIBLE', 'User has not verified account');
    }

    const referralCodeExists = await appReferralCode.findOne({
        where: {
            campaignId
        }
    });

    if (referralCodeExists) {
        return referralCodeExists;
    }

    const referralCode = await generateReferralCode();

    const referral = await appReferralCode.create({
        code: referralCode,
        campaignId,
        userId
    });

    return referral;
};

/**
 * Use a referral code. The code should increment it's number of usages and can
 * only be used Y times where Y is a number that can be configured.
 * The code should be associated with the user who used it.
 */
export const useReferralCode = async (userId: number, referralCode: string) => {
    const user = await appUser.findOne({
        where: {
            id: userId
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    const referralCodeExists = await appReferralCode.findOne({
        include: [
            {
                model: appUser,
                as: 'user'
            }
        ],
        where: {
            code: referralCode
        }
    });

    if (!referralCodeExists || !referralCodeExists.user) {
        throw new Error('Referral code not found');
    }

    const signer = new ethers.Wallet(
        config.signers.referralLink,
        new ethers.providers.JsonRpcProvider(config.jsonRpcUrl)
    );
    const referralLinkContract = new ethers.Contract(
        config.contractAddresses.referralLink,
        referralsLinkABI,
        signer
    ) as ReferralsLinkContract;

    // validate code usages from the smart-contract
    // sign message
    const [referralUsages, rawMaxUsages, signature] = await Promise.all([
        referralLinkContract.campaignReferralLinks(referralCodeExists.campaignId.toString(), user.address),
        referralLinkContract.campaigns(referralCodeExists.campaignId),
        signParams(referralCodeExists.user.address, referralCodeExists.campaignId, user.address)
    ]);
    const maxUsages = rawMaxUsages.maxReferralLinks.toNumber();

    if (referralUsages.toNumber() >= maxUsages) {
        throw new Error('Referral code already used');
    }

    try {
        // call smart-contract to send funds to new user
        await referralLinkContract.claimReward(
            referralCodeExists.user.address,
            [referralCodeExists.campaignId.toString()],
            [user.address],
            [signature]
        );
    } catch (error) {
        if (error.error?.message?.indexOf('ReferralLink') !== -1) {
            throw new utils.BaseError(
                'REFERRAL_LINK_ERROR',
                error.error?.message?.match(/\"execution reverted: ([\w\s\d:]*)\",/)[1]
            );
        }

        throw error;
    }
};
