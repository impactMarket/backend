import Logger from '../loaders/logger';
import CommunityService from '../services/community';
import BigNumber from 'bignumber.js';
import UserService from '../services/user';
import { notifyBackersCommunityLowFunds } from '../utils';

async function verifyCommunityFunds(): Promise<void> {
    Logger.info('Verifying community funds...');
    const communities = await CommunityService.getAll('valid');

    communities.forEach(async (community) => {
        if (community.backers.length > 1 && community.totalClaimed !== '0') {
            const isLessThan10 = parseFloat(new BigNumber(community.totalClaimed)
                .div(community.totalRaised)
                .toString()) >= 0.9;

            if (isLessThan10) {
                const pushTokens = await UserService.getPushTokensFromAddresses(community.backers);
                notifyBackersCommunityLowFunds(community, pushTokens);
            }
        }
    });
}

export {
    verifyCommunityFunds,
}