import GlobalDailyStateService from '@services/global/globalDailyState';
import GlobalGrowthService from '@services/global/globalGrowth';
import ReachedAddressService from '@services/reachedAddress';
import CommunityDailyMetricsService from '@services/ubi/communityDailyMetrics';
import InflowService from '@services/ubi/inflow';
import BigNumber from 'bignumber.js';
import { mean } from 'mathjs';
import { col, fn, Op, QueryTypes, Sequelize } from 'sequelize';

import config from '../../../config';
import { models, sequelize } from '../../../database';

BigNumber.config({ EXPONENTIAL_AT: [-7, 30] });

function calculateGrowth(
    past: string | BigInt | number,
    now: string | BigInt | number
): number {
    let r: number | undefined = undefined;
    if (typeof past === 'string' && typeof now === 'string') {
        r = new BigNumber(now)
            .minus(new BigNumber(past))
            .dividedBy(new BigNumber(past))
            .multipliedBy(100)
            .toNumber();
    } else if (past instanceof BigInt && now instanceof BigInt) {
        r = Number(((BigInt(now) - BigInt(past)) / BigInt(past)) * BigInt(100));
    } else if (typeof past === 'number' && typeof now === 'number') {
        r = ((now - past) / past) * 100;
    }
    if (r !== undefined) {
        return Math.round(r * 10) / 10;
    }
    throw new Error('Invalid input!');
}

async function calculateMetricsGrowth(
    globalDailyStateService: GlobalDailyStateService
) {
    const globalGrowthService = new GlobalGrowthService();

    const todayMidnightTime = new Date();
    todayMidnightTime.setHours(0, 0, 0, 0);
    const yesterdayDateOnly = new Date();
    yesterdayDateOnly.setHours(0, 0, 0, 0);
    yesterdayDateOnly.setDate(todayMidnightTime.getDate() - 1);
    const aMonthAgo = new Date();
    aMonthAgo.setHours(0, 0, 0, 0);
    aMonthAgo.setDate(yesterdayDateOnly.getDate() - 30);

    const present = await globalDailyStateService.sumLast30Days(
        yesterdayDateOnly
    );
    const past = await globalDailyStateService.sumLast30Days(aMonthAgo);

    const growthToAdd = {
        date: yesterdayDateOnly,
        claimed: calculateGrowth(past.tClaimed, present.tClaimed),
        claims: calculateGrowth(past.tClaims, present.tClaims),
        beneficiaries: calculateGrowth(
            past.tBeneficiaries,
            present.tBeneficiaries
        ),
        raised: calculateGrowth(past.tRaised, present.tRaised),
        backers: calculateGrowth(past.tBackers, present.tBackers),
        fundingRate: calculateGrowth(past.fundingRate, present.fundingRate),
        volume: calculateGrowth(past.tVolume, present.tVolume),
        transactions: calculateGrowth(
            past.tTransactions,
            present.tTransactions
        ),
        reach: calculateGrowth(past.tReach, present.tReach),
        reachOut: calculateGrowth(past.tReachOut, present.tReachOut),
    };
    await globalGrowthService.add(growthToAdd);
}

/**
 * As this is all calculated past midnight, everything is from yesterdayDateOnly
 */
export async function calcuateGlobalMetrics(): Promise<void> {
    const calculateAvgComulativeUbi = async (): Promise<string> => {
        // await models.ubiCommunityContract.findAll({
        //     attributes: [[fn('sum', col('maxClaim')), 'avgComulativeUbi']],
        //     include: [
        //         {
        //             model: models.community,
        //             as: 'community',
        //             where: {
        //                 status: 'valid',
        //                 visibility: 'public',
        //             },
        //         },
        //     ],
        // });

        const query = `select avg(cc."maxClaim") avgComulativeUbi
        from ubi_community_contract cc, community c
        where c.id = cc."communityId"
        and c.status = 'valid'
        and c.visibility = 'public'`;
        const r: any = await sequelize.query(query, {
            type: QueryTypes.SELECT,
        });

        return r[0].avgComulativeUbi;
    };

    const sumCommunities = async (
        date: Date
    ): Promise<{
        totalClaimed: string;
        totalClaims: number;
        totalBeneficiaries: number;
        totalRaised: string;
        totalVolume: string;
        totalTransactions: number;
    }> => {
        const query = `select sum(cs.claimed) "totalClaimed",
                        sum(cs.claims) "totalClaims",
                        sum(cs.beneficiaries) "totalBeneficiaries",
                        sum(cs.raised) "totalRaised"
                        sum(cs.volume) "totalVolume"
                        sum(cs.transactions) "totalTransactions"
                from ubi_community_daily_state cs, community c
                where cs."communityId" = c.id
                and c.status = 'valid'
                and c.visibility = 'public'
                and cs.date = '${date.toISOString().split('T')[0]}'`;

        const result = await sequelize.query<{
            totalClaimed: string;
            totalClaims: string;
            totalBeneficiaries: string;
            totalRaised: string;
            totalVolume: string;
            totalTransactions: string;
        }>(query, { type: QueryTypes.SELECT });

        return {
            totalClaimed: result[0].totalClaimed,
            totalClaims: parseInt(result[0].totalClaims, 10),
            totalBeneficiaries: parseInt(result[0].totalBeneficiaries, 10),
            totalRaised: result[0].totalRaised,
            totalVolume: result[0].totalVolume,
            totalTransactions: parseInt(result[0].totalTransactions, 10),
        };
    };

    const txReach = async (
        date: Date
    ): Promise<{
        reach: string[];
        reachOut: string[];
    }> => {
        const uniqueAddressesReached = await models.beneficiaryTransaction.findAll(
            {
                attributes: [[fn('distinct', col('withAddress')), 'addresses']],
                where: { date },
                raw: true,
            }
        ); // this is an array, wich can be empty (return no rows)
        const uniqueAddressesReachedOut = await models.beneficiaryTransaction.findAll(
            {
                attributes: [[fn('distinct', col('withAddress')), 'addresses']],
                where: {
                    date,
                    withAddress: {
                        [Op.notIn]: Sequelize.literal(
                            '(select distinct address from beneficiary)'
                        ),
                    },
                },
                raw: true,
            }
        ); // this is an array, wich can be empty (return no rows)
        return {
            reach:
                uniqueAddressesReached.length === 0
                    ? []
                    : uniqueAddressesReached.map((a: any) => a.addresses),
            reachOut:
                uniqueAddressesReachedOut.length === 0
                    ? []
                    : uniqueAddressesReachedOut.map((a: any) => a.addresses),
        };
    };

    /**
     * Get total monthly (last 30 days, starting todayMidnightTime) raised amounts.
     *
     * **NOTE**: raised amounts will always be bigger than zero though,
     * a community might not be listed if no raise has ever happened!
     *
     * @returns string
     */
    const getMonthlyRaised = async (from: Date): Promise<string> => {
        // 30 days ago, from todayMidnightTime
        const aMonthAgo = new Date();
        aMonthAgo.setDate(from.getDate() - 30);
        const query = `select sum(i.amount) raised from inflow i, community c where i."communityId" = c."publicId" and c.status = 'valid' and c.visibility = 'public' and i."txAt" >= '${
            aMonthAgo.toISOString().split('T')[0]
        }' and i."txAt" < '${from.toISOString().split('T')[0]}'`;

        const result = await sequelize.query<{
            raised: string;
        }>(query, { type: QueryTypes.SELECT });
        return result[0].raised;
    };

    const getMonthlyClaimed = async (from: Date): Promise<string> => {
        // 30 days ago, from todayMidnightTime
        const aMonthAgo = new Date();
        aMonthAgo.setDate(from.getDate() - 30);
        const query = `select sum(i.amount) claimed from claim i, community c where i."communityId" = c."publicId" and c.status = 'valid' and c.visibility = 'public' and i."txAt" >= '${
            aMonthAgo.toISOString().split('T')[0]
        }' and i."txAt" < '${from.toISOString().split('T')[0]}'`;

        const result = await sequelize.query<{
            claimed: string;
        }>(query, { type: QueryTypes.SELECT });
        return result[0].claimed;
    };

    const reachedAddressService = new ReachedAddressService();
    const globalDailyStateService = new GlobalDailyStateService();
    const todayMidnightTime = new Date();
    todayMidnightTime.setHours(0, 0, 0, 0);
    const yesterdayDateOnly = new Date(); // yesterdayDateOnly
    yesterdayDateOnly.setHours(0, 0, 0, 0);
    yesterdayDateOnly.setDate(yesterdayDateOnly.getDate() - 1);

    //
    const lastGlobalMetrics = await globalDailyStateService.getLast();
    const last4DaysAvgSSI = await globalDailyStateService.getLast4AvgMedianSSI();

    //
    const summedCommunities = await sumCommunities(yesterdayDateOnly);
    const volumeTransactionsAndAddresses = await txReach(yesterdayDateOnly);

    //
    const backersAndFunding = await InflowService.uniqueBackersAndFundingLast30Days(
        todayMidnightTime
    );
    const communitiesAvgYesterday = await CommunityDailyMetricsService.getCommunitiesAvg(
        yesterdayDateOnly
    );

    const monthlyClaimed = await getMonthlyClaimed(todayMidnightTime);
    const monthlyRaised = await getMonthlyRaised(todayMidnightTime);
    const totalBackers = await InflowService.countEvergreenBackers();

    // inflow / outflow
    const totalRaised = new BigNumber(lastGlobalMetrics.totalRaised)
        .plus(summedCommunities.totalRaised)
        .toString();
    const totalDistributed = new BigNumber(lastGlobalMetrics.totalDistributed)
        .plus(summedCommunities.totalClaimed)
        .toString();
    const totalBeneficiaries =
        lastGlobalMetrics.totalBeneficiaries +
        summedCommunities.totalBeneficiaries;

    // ubi pulse
    const givingRate = parseFloat(
        new BigNumber(backersAndFunding.funding)
            .dividedBy(10 ** config.cUSDDecimal) // set 18 decimals from onchain values
            .dividedBy(backersAndFunding.backers)
            .dividedBy(30)
            .decimalPlaces(2, 1)
            .toString()
    );

    // economic activity
    const reach = volumeTransactionsAndAddresses.reach.length;
    const reachOut = volumeTransactionsAndAddresses.reachOut.length;
    await reachedAddressService.updateReachedList(
        volumeTransactionsAndAddresses.reach // no need to concat reachOut. reach as all new addresses
    );
    // TODO: spending rate
    const spendingRate = 0;

    // chart data by day, all communities sum
    // remaining data are in communitiesYesterday
    const fundingRate = parseFloat(
        new BigNumber(monthlyRaised)
            .minus(monthlyClaimed)
            .dividedBy(monthlyRaised)
            .multipliedBy(100)
            .toFixed(2, 1)
    );
    const totalVolume = new BigNumber(lastGlobalMetrics.totalVolume)
        .plus(summedCommunities.totalVolume)
        .toString();
    const totalTransactions = new BigNumber(
        lastGlobalMetrics.totalTransactions.toString()
    )
        .plus(summedCommunities.totalTransactions)
        .toString();
    const allReachEver = await reachedAddressService.getAllReachedEver();

    const avgMedianSSI = mean(
        last4DaysAvgSSI.concat([communitiesAvgYesterday.medianSSI])
    );
    // register new global daily state
    await globalDailyStateService.add({
        date: yesterdayDateOnly,
        avgMedianSSI: Math.round(avgMedianSSI * 100) / 100,
        claimed: summedCommunities.totalClaimed,
        claims: summedCommunities.totalClaims,
        beneficiaries: summedCommunities.totalBeneficiaries,
        raised: summedCommunities.totalRaised,
        backers: backersAndFunding.backers,
        volume: summedCommunities.totalVolume,
        transactions: summedCommunities.totalTransactions,
        reach,
        reachOut,
        totalRaised,
        totalDistributed,
        totalBackers,
        totalBeneficiaries,
        givingRate,
        ubiRate: Math.round(communitiesAvgYesterday.avgUbiRate * 100) / 100,
        fundingRate,
        spendingRate,
        avgComulativeUbi: await calculateAvgComulativeUbi(),
        avgUbiDuration: communitiesAvgYesterday.avgEstimatedDuration,
        totalVolume,
        totalTransactions: BigInt(totalTransactions),
        totalReach: BigInt(allReachEver.reach),
        totalReachOut: BigInt(allReachEver.reachOut),
    });

    // calculate global growth
    await calculateMetricsGrowth(globalDailyStateService);
}
