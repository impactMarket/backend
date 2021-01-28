import { Logger } from '@utils/logger';
import BeneficiaryService from '@services/beneficiary';
import CommunityService from '@services/community';
import CommunityContractService from '@services/communityContract';
import CommunityDailyMetricsService from '@services/communityDailyMetrics';
import CommunityDailyStateService from '@services/communityDailyState';
import InflowService from '@services/inflow';
import NotifiedBackerService from '@services/notifiedBacker';
import UserService from '@services/user';
import BigNumber from 'bignumber.js';
import { median, mean } from 'mathjs';

import config from '../../../config';
import { notifyBackersCommunityLowFunds } from '@utils/util';
import { ICommunity } from '@ipcttypes/endpoints';
import CommunityStateService from '@services/communityState';

export async function calcuateCommunitiesMetrics(): Promise<void> {
    Logger.info('Calculating community metrics...');
    // this should run post-midnight (well, at midnight)
    const yesterday = new Date(new Date().getTime() - 86400000);
    const todayDateOnly = new Date();
    todayDateOnly.setHours(0, 0, 0, 0);
    const activeBeneficiariesLast30Days = await BeneficiaryService.getActiveBeneficiariesLast30Days();
    const totalClaimedLast30Days = await CommunityDailyStateService.getTotalClaimedLast30Days();
    const ssiLast4Days = await CommunityDailyMetricsService.getSSILast4Days();
    const communitiesContract = await CommunityContractService.getAll();
    const calculateMetrics = async (community: ICommunity) => {
        // if no activity, do not calculate
        if (
            community.state.claimed === '0' ||
            community.state.raised === '0' ||
            totalClaimedLast30Days.get(community.publicId) === undefined ||
            activeBeneficiariesLast30Days.get(community.publicId) ===
                undefined ||
            activeBeneficiariesLast30Days.get(community.publicId) === 0
        ) {
            return;
        }
        const beneficiaries = await BeneficiaryService.listActiveInCommunity(
            community.publicId
        );
        if (beneficiaries.length < 1) {
            return;
        }
        let ssiDayAlone: number = 0;
        let ssi: number = 0;
        let ubiRate: number = 0;
        let estimatedDuration: number = 0;

        const beneficiariesTimeToWait: number[] = [];
        const beneficiariesTimeWaited: number[] = [];

        for (let b = 0; b < beneficiaries.length; b++) {
            const beneficiary = beneficiaries[b];
            // at least two claims are necessary
            if (
                beneficiary.claims < 2 ||
                beneficiary.lastClaimAt === null ||
                beneficiary.penultimateClaimAt === null
            ) {
                continue;
            }
            // the first time you don't wait a single second, the second time, only base interval
            const timeToWait =
                community.contract.baseInterval +
                (beneficiary.claims - 2) *
                    community.contract.incrementInterval;
            const timeWaited =
                Math.floor(
                    (beneficiary.lastClaimAt.getTime() -
                        beneficiary.penultimateClaimAt.getTime()) /
                        1000
                ) - timeToWait;
            // console.log(beneficiary.address, beneficiary.lastClaimAt, beneficiary.penultimateClaimAt);
            beneficiariesTimeToWait.push(timeToWait);
            beneficiariesTimeWaited.push(timeWaited);
        }
        if (
            beneficiariesTimeToWait.length > 1 &&
            beneficiariesTimeWaited.length > 1
        ) {
            // calculate ssi day alone
            const meanTimeToWait = mean(beneficiariesTimeToWait);
            const madTimeWaited = median(beneficiariesTimeWaited);
            // console.log(community.name, madTimeWaited, meanTimeToWait);
            ssiDayAlone = parseFloat(
                ((madTimeWaited / meanTimeToWait) * 50) /* aka, 100 / 2 */
                    .toFixed(2)
            );

            // ssi
            const ssisAvailable = ssiLast4Days.get(community.publicId);
            if (ssisAvailable === undefined) {
                ssi = ssiDayAlone;
            } else {
                const sumSSI =
                    ssisAvailable.reduce((acc, cssi) => acc + cssi, 0) +
                    ssiDayAlone;
                ssi =
                    Math.round(
                        parseFloat(
                            (sumSSI / (ssisAvailable.length + 1)).toFixed(2)
                        ) * 100
                    ) / 100;
            }
        }

        let daysSinceStart = Math.round(
            (todayDateOnly.getTime() - new Date(community.started).getTime()) /
                86400000
        ); // 86400000 1 days in ms
        if (daysSinceStart > 30) {
            daysSinceStart = 30;
        }

        // calculate ubiRate
        ubiRate = parseFloat(
            new BigNumber(totalClaimedLast30Days.get(community.publicId)!)
                .dividedBy(10 ** config.cUSDDecimal) // set 18 decimals from onchain values
                .dividedBy(
                    activeBeneficiariesLast30Days.get(community.publicId)!
                )
                .dividedBy(daysSinceStart)
                .toFixed(2, 1)
        );

        // calculate estimatedDuration
        estimatedDuration = parseFloat(
            new BigNumber(communitiesContract.get(community.publicId)!.maxClaim)
                .dividedBy(10 ** config.cUSDDecimal) // set 18 decimals from onchain values
                .dividedBy(ubiRate)
                .dividedBy(30)
                .toFixed(2, 1)
        );

        await CommunityDailyMetricsService.add(
            community.publicId,
            ssiDayAlone,
            ssi,
            ubiRate,
            estimatedDuration,
            // since it's calculated post-midnight, save it with yesterdayDateOnly's date
            yesterday
        );
    };
    const communities = await CommunityService.listFull();
    // for each community
    for (let index = 0; index < communities.length; index++) {
        await calculateMetrics(communities[index]);
    }
}

export async function verifyCommunityFunds(): Promise<void> {
    Logger.info('Verifying community funds...');
    const communitiesState = await CommunityStateService.getAllCommunitiesState();

    communitiesState.forEach(async (communityState) => {
        if (communityState.backers > 0 && communityState.claimed !== '0') {
            const isLessThan10 =
                parseFloat(
                    new BigNumber(communityState.claimed)
                        .div(communityState.raised)
                        .toString()
                ) >= 0.9;

            if (isLessThan10) {
                const community = await CommunityService.getCommunityOnlyByPublicId(communityState.communityId);
                if (community !== null) {
                    const backersAddresses = await NotifiedBackerService.add(
                        await InflowService.getAllBackers(community.publicId),
                        community.publicId
                    );
                    const pushTokens = await UserService.getPushTokensFromAddresses(
                        backersAddresses
                    );
                    notifyBackersCommunityLowFunds(community, pushTokens);
                }
            }
        }
    });
}

export async function populateCommunityDailyState(): Promise<void> {
    Logger.info('Inserting community empty daily state...');
    const communities = await CommunityService.listCommunitiesStructOnly();

    communities.forEach((community) => {
        CommunityDailyStateService.populateNext5Days(community.publicId);
    });
}
