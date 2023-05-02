import { database } from '@impactmarket/core';
import { randomBytes } from 'crypto';

/**
 * Generate a referral code for a user.
 * @returns referral code
 */
export const generateReferralCode = async () => {
    const referralCode = randomBytes(4).toString('hex');

    const exists = await database.models.appUser.findOne({
        where: {
            referralCode,
        },
    });

    if (exists) {
        return generateReferralCode();
    }

    return referralCode;
};

/**
 * Get a referral code for a user, if the user has created an account less that 2 months ago.
 * The referral should be 8 characters long, totally random, and unique. The code should be
 * stored in the database, and should be associated with the user who created it. It should be
 * possible to use it X times, where X is a number that can be configured.
 */
export const getReferralCode = async (userId: number) => {
    const user = await database.models.appUser.findOne({
        where: {
            id: userId,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    if (user.referralCode) {
        return user.referralCode;
    }

    const referralCode = await generateReferralCode();

    await database.models.appUser.update(
        {
            referralCode,
        },
        {
            where: {
                id: userId,
            },
        }
    );

    return referralCode;
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

    if (user.referralCode) {
        throw new Error('User already has a referral code');
    }

    const referral = await database.models.appUser.findOne({
        where: {
            referralCode,
        },
    });

    if (!referral) {
        throw new Error('Referral not found');
    }

    // TODO: validate code usages from the smart-contract

    // TODO: call smart-contract to send funds to new user
};
