import { services, utils, config } from '@impactmarket/core';
import * as Sentry from '@sentry/serverless';

Sentry.AWSLambda.init({
    dsn: config.sentryKey,
    tracesSampleRate: 1.0,
});

export const calculateGlobalGrowth = Sentry.AWSLambda.wrapHandler(
    async (event, context) => {
        try {
            console.log('Start calculateGlobalGrowth: ', new Date());
            const globalGrowthService =
                new services.global.GlobalGrowthService();
            const globalDailyStateService =
                new services.global.GlobalDailyStateService();

            const todayMidnightTime = new Date();
            todayMidnightTime.setUTCHours(0, 0, 0, 0);
            const yesterdayDateOnly = new Date();
            yesterdayDateOnly.setUTCHours(0, 0, 0, 0);
            yesterdayDateOnly.setDate(todayMidnightTime.getDate() - 1);
            const aMonthAgo = new Date();
            aMonthAgo.setUTCHours(0, 0, 0, 0);
            aMonthAgo.setDate(yesterdayDateOnly.getDate() - 30);

            const present = await globalDailyStateService.sumLast30Days(
                yesterdayDateOnly
            );
            const past = await globalDailyStateService.sumLast30Days(aMonthAgo);

            const growthToAdd = {
                date: yesterdayDateOnly,
                claimed: utils.util.calculateGrowth(
                    past.tClaimed,
                    present.tClaimed
                ),
                claims: utils.util.calculateGrowth(
                    past.tClaims,
                    present.tClaims
                ),
                beneficiaries: utils.util.calculateGrowth(
                    past.tBeneficiaries,
                    present.tBeneficiaries
                ),
                raised: utils.util.calculateGrowth(
                    past.tRaised,
                    present.tRaised
                ),
                backers: utils.util.calculateGrowth(
                    past.tBackers,
                    present.tBackers
                ),
                fundingRate: utils.util.calculateGrowth(
                    past.fundingRate,
                    present.fundingRate
                ),
                volume: utils.util.calculateGrowth(
                    past.tVolume,
                    present.tVolume
                ),
                transactions: utils.util.calculateGrowth(
                    past.tTransactions,
                    present.tTransactions
                ),
                reach: utils.util.calculateGrowth(past.tReach, present.tReach),
                reachOut: utils.util.calculateGrowth(
                    past.tReachOut,
                    present.tReachOut
                ),
            };
            await globalGrowthService.add(growthToAdd);
            console.log('calculateGlobalGrowth finished');
        } catch (error) {
            console.error('Error: ', error);
            throw error;
        }
    }
);
