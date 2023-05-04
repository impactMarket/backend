import { database } from '@impactmarket/core';
import { randomBytes } from 'crypto';

/**
 * Generate a referral code for a user and save to AppReferralCode.
 * @returns referral code
 */
export const generateReferralCode = async () => {
    const referralCode = randomBytes(4).toString('hex');

    const referralCodeExists = await database.models.appReferralCode.findOne({
        where: {
            code: referralCode,
        },
    });

    if (referralCodeExists) {
        return generateReferralCode();
    }

    return referralCode;
};

/**
 * Get a referral code for a user in AppReferralCode,
 * if the user account has been created an account less that 2 months ago.
 * The referral should be 8 characters long, totally random, and unique. The code should be
 * stored in the database, alongside the campaign and should be associated with the user who created it.
 * It should be possible to use it X times, where X is a number that can be configured.
 */
export const getReferralCode = async (userId: number, campaignId: number) => {
    const user = await database.models.appUser.findOne({
        where: {
            id: userId,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const referralCodeExists = await database.models.appReferralCode.findOne({
        where: {
            campaignId,
        },
    });

    if (referralCodeExists) {
        return referralCodeExists;
    }

    const referralCode = await generateReferralCode();

    const referral = await database.models.appReferralCode.create({
        code: referralCode,
        campaignId,
        userId,
    });

    return referral;
};

/**
 * Use a referral code. The code should increment it's number of usages and can only be used Y times where Y is a number that can be configured.
 * The code should be associated with the user who used it.
 */
export const useReferralCode = async (userId: number, referralCode: string) => {
    const user = await database.models.appUser.findOne({
        where: {
            id: userId,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const referralCodeExists = await database.models.appReferralCode.findOne({
        where: {
            code: referralCode,
        },
    });

    if (!referralCodeExists) {
        throw new Error('Referral code not found');
    }

    // TODO: validate code usages from the smart-contract

    // TODO: call smart-contract to send funds to new user
};
