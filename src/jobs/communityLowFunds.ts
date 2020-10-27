import Logger from '../loaders/logger';
import CommunityService from '../services/community';
import BigNumber from 'bignumber.js';
import UserService from '../services/user';
import { notifyBackersCommunityLowFunds } from '../utils';
import NotifiedBackerService from '../services/notifiedBacker';

async function verifyCommunityFunds(): Promise<void> {
    Logger.info('Verifying community funds...');
    const communities = await CommunityService.getAll('valid');

    communities.forEach(async (community) => {
        if (community.backers.length > 0 && community.totalClaimed !== '0') {
            const isLessThan10 = parseFloat(new BigNumber(community.totalClaimed)
                .div(community.totalRaised)
                .toString()) >= 0.8;

            if (isLessThan10) {
                const backersAddresses = await NotifiedBackerService.add(
                    community.backers,
                    community.publicId
                );
                const pushTokens = await UserService.getPushTokensFromAddresses(backersAddresses);
                console.log(pushTokens)
                notifyBackersCommunityLowFunds(community, pushTokens);
            }
        }
    });
}

export {
    verifyCommunityFunds,
}