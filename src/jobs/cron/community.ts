import Logger from '../../loaders/logger';
import CommunityService from '../../services/community';
import BigNumber from 'bignumber.js';
import UserService from '../../services/user';
import { notifyBackersCommunityLowFunds } from '../../utils';
import NotifiedBackerService from '../../services/notifiedBacker';
import CommunityDailyStateService from '../../services/communityDailyState';
import { ICommunityInfo } from '../../types';
import BeneficiaryService from '../../services/beneficiary';
import { Beneficiary } from '../../db/models/beneficiary';
import CommunityDailyMetricsService from '../../services/communityDailyMetrics';
import { median, mean } from 'mathjs';


async function calcuateMetrics(): Promise<void> {
    Logger.info('Calculating community metrics...');
    const calculateMetrics = async (community: ICommunityInfo) => {
        let ssi: number | null = null;
        let fundingRate: number | null = null;

        const beneficiariesTimeToWait: number[] = [];
        const beneficiariesTimeWaited: number[] = [];

        const beneficiaries = (
            await BeneficiaryService.getAllInCommunity(community.publicId)
        ).reduce((map, obj) => {
            map[obj.address] = obj;
            return map;
        }, {} as { [key: string]: Beneficiary; });

        for (const beneficiaryAdddress in beneficiaries) {
            const beneficiary = beneficiaries[beneficiaryAdddress];
            // at least two claims are necessary
            if (beneficiary.claims < 2) {
                continue;
            }
            // the first time you don't wait a single second, the second time, only base interval
            const timeToWait = parseInt(community.vars._baseInterval, 10) + (beneficiary.claims - 2) * parseInt(community.vars._incrementInterval, 10);
            const timeWaited = Math.floor((beneficiary.lastClaimAt.getTime() - beneficiary.penultimateClaimAt.getTime()) / 1000) - timeToWait;
            beneficiariesTimeToWait.push(timeToWait);
            beneficiariesTimeWaited.push(timeWaited);
        }
        // calculate ssi
        if (beneficiariesTimeToWait.length > 1 && beneficiariesTimeWaited.length > 1) {
            const meanTimeToWait = mean(beneficiariesTimeToWait);
            const madTimeWaited = median(beneficiariesTimeWaited);
            ssi = parseFloat(((madTimeWaited / meanTimeToWait) * 50 /* aka, 100 / 2 */).toFixed(2));
        }
        // TODO: calculate funding rate
        
        if (ssi !== null || fundingRate !== null) {
            CommunityDailyMetricsService.add(
                community.publicId,
                ssi,
                fundingRate,
                new Date(),
            );
        }
    }
    const communities = await CommunityService.getAll('valid');
    // for each community
    communities.forEach(calculateMetrics);
}

export async function verifyCommunityFunds(): Promise<void> {
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
                notifyBackersCommunityLowFunds(community, pushTokens);
            }
        }
    });
}

export async function populateCommunityDailyState(): Promise<void> {
    Logger.info('Inserting community empty daily state...');
    const communities = await CommunityService.getAll('valid');

    communities.forEach((community) => {
        CommunityDailyStateService.populateNext5Days(community.publicId);
    });
}