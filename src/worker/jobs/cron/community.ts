import { ICommunity } from '@ipcttypes/endpoints';
import { CommunityAttributes } from '@models/ubi/community';
import UserService from '@services/app/user';
import NotifiedBackerService from '@services/notifiedBacker';
import BeneficiaryService from '@services/ubi/beneficiary';
import CommunityService from '@services/ubi/community';
import CommunityContractService from '@services/ubi/communityContract';
import CommunityDailyMetricsService from '@services/ubi/communityDailyMetrics';
import CommunityDailyStateService from '@services/ubi/communityDailyState';
import CommunityStateService from '@services/ubi/communityState';
import InflowService from '@services/ubi/inflow';
import { Logger } from '@utils/logger';
import { notifyBackersCommunityLowFunds } from '@utils/util';
import BigNumber from 'bignumber.js';
import { median, mean } from 'mathjs';

import config from '../../../config';
import { models } from '../../../database';

export async function verifyCommunitySuspectActivity(): Promise<void> {
    //
    const communities = await models.community.findAll({
        include: [
            {
                model: models.beneficiary,
                as: 'beneficiaries',
                include: [
                    {
                        model: models.user,
                        as: 'user',
                        include: [
                            {
                                model: models.appUserTrust,
                                as: 'throughTrust',
                                include: [
                                    {
                                        model: models.appUserTrust,
                                        as: 'selfTrust',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    });
    for (let c = 0; c < communities.length; c++) {
        const community = communities[c].toJSON() as CommunityAttributes;
        if (community.beneficiaries!.length > 0) {
            const suspectBeneficiaries = community.beneficiaries!.filter((b) =>
                b.user && b.user.throughTrust && b.user!.throughTrust.length > 0
                    ? b.user.throughTrust?.length > 1 ||
                      b.user.throughTrust[0].suspect
                    : false
            );
            if (suspectBeneficiaries.length === 0) {
                continue;
            }
            const ps =
                (suspectBeneficiaries.length /
                    (community.beneficiaries!.length -
                        suspectBeneficiaries.length)) *
                100;
            const y = 60 * Math.log(ps);
            const suspectLevel = Math.round(Math.min(y, 100) / 10);
            // save suspect level
            models.ubiCommunitySuspect.create({
                communityId: community.id,
                percentage: ps,
                suspect: suspectLevel,
            });
        }
    }
}

export async function calcuateCommunitiesMetrics(): Promise<void> {
    // this should run post-midnight (well, at midnight)
    const todayDateOnly = new Date();
    todayDateOnly.setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(todayDateOnly.getDate() - 1);
    const activeBeneficiariesLast30Days = await BeneficiaryService.getActiveBeneficiariesLast30Days();
    const totalClaimedLast30Days = await CommunityDailyStateService.getTotalClaimedLast30Days();
    const ssiLast4Days = await CommunityDailyMetricsService.getSSILast4Days();
    const communitiesContract = await CommunityContractService.getAll();
    //
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
            if (community.contract === undefined) {
                continue;
            }
            const timeToWait =
                community.contract.baseInterval +
                (beneficiary.claims - 2) * community.contract.incrementInterval;
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
            beneficiariesTimeToWait.length < 2 ||
            beneficiariesTimeWaited.length < 2
        ) {
            return;
        }
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
            new BigNumber(communitiesContract.get(community.id)!.maxClaim)
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
    const pending: Promise<void>[] = [];
    // for each community
    for (let index = 0; index < communities.length; index++) {
        pending.push(calculateMetrics(communities[index]));
        // await calculateMetrics(communities[index]);
    }
    await Promise.all(pending);
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
                const community = await CommunityService.getCommunityOnlyById(
                    communityState.communityId
                );
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
        CommunityDailyStateService.populateNext5Days(community.id);
    });
}
