import { BigNumber } from 'bignumber.js';
import { col, fn, Op } from 'sequelize';

import config from '../../config';
import { models } from '../../database';
import {
    GlobalDailyState,
    GlobalDailyStateCreationAttributes,
} from '../../database/models/global/globalDailyState';
import { getUbiDailyEntity } from '../../subgraph/queries/ubi';

export default class GlobalDailyStateService {
    public globalDailyState = models.globalDailyState;
    public community = models.community;

    public add(
        state: GlobalDailyStateCreationAttributes
    ): Promise<GlobalDailyState> {
        return this.globalDailyState.create(state);
    }

    public async numbers(): Promise<{
        claimed: string;
        countries: number;
        beneficiaries: number;
        backers: number;
        communities: number;
    }> {
        const countries = await this.community.count({
            col: 'country',
            distinct: true,
            where: {
                visibility: 'public',
                status: 'valid',
            },
        });
        const communities = await this.community.count({
            where: {
                visibility: 'public',
                status: 'valid',
            },
        });
        const totalUbi = (await getUbiDailyEntity(`id: 0`))[0];
        return {
            claimed: totalUbi.claimed,
            countries,
            beneficiaries: totalUbi.beneficiaries,
            backers: totalUbi.contributors,
            communities,
        };
    }

    public async count(): Promise<number> {
        // it was null just once at the system's begin.
        return await this.globalDailyState.count();
    }

    public async sumLast30Days(from: Date): Promise<{
        tClaimed: string;
        tClaims: number;
        tBeneficiaries: number;
        tRaised: string;
        tBackers: number;
        fundingRate: number;
        tVolume: string;
        tTransactions: string;
        tReach: string;
        tReachOut: string;
    }> {
        // it was null just once at the system's begin.
        const aMonthAgo = new Date(from.getTime());
        aMonthAgo.setDate(aMonthAgo.getDate() - 30);
        const firstDate = (((aMonthAgo.getTime() / 1000) | 0) / 86400) | 0;
        const endDate = (((from.getTime() / 1000) | 0) / 86400) | 0;
        const results = await getUbiDailyEntity(
            `id_gte: ${firstDate}, id_lt: ${endDate}`
        );

        const toToken = (value: string) =>
            new BigNumber(value).multipliedBy(10 ** 18).toString();

        const result = results.reduce((acc, el) => {
            return {
                tClaimed: new BigNumber(
                    parseFloat(acc.tClaimed || 0) + parseFloat(el.claimed)
                ).toString(),
                tClaims: el.claims + acc.tClaims || 0,
                tBeneficiaries: el.beneficiaries + acc.tBeneficiaries || 0,
                tRaised: new BigNumber(
                    parseFloat(acc.tRaised || 0) + parseFloat(el.contributed)
                ).toString(),
                tBackers: el.contributors + acc.tBackers || 0,
                tVolume: new BigNumber(
                    parseFloat(acc.tVolume || 0) + parseFloat(el.volume)
                ).toString(),
                tTransactions: el.transactions + acc.tTransactions || 0,
                tReach: el.reach + acc.tReach || 0,
                tReachOut: 0,
            };
        }, {} as any);

        const fr = results[0];

        return {
            tClaimed: toToken(result.tClaimed),
            tClaims: result.tClaims,
            tBeneficiaries: result.tBeneficiaries,
            tRaised: toToken(result.tRaised),
            tBackers: result.tBackers,
            fundingRate: Number(fr.fundingRate),
            tVolume: toToken(result.tVolume),
            tTransactions: result.tTransactions,
            tReach: result.tReach,
            tReachOut: result.tReachOut,
        };
    }

    public async getLast30Days(): Promise<
        (GlobalDailyStateCreationAttributes & { monthReach: number })[]
    > {
        try {
            const todayMidnightTime = new Date();
            todayMidnightTime.setHours(0, 0, 0, 0);
            // // 30 days ago, from todayMidnightTime
            const aMonthAgo = new Date(
                todayMidnightTime.getTime() - 2592000000
            ); // 30 * 24 * 60 * 60 * 1000
            // it was null just once at the system's begin.
            const globalDailyState = await this.globalDailyState.findAll({
                attributes: [
                    'ubiRate',
                    'avgComulativeUbi',
                    'avgUbiDuration',
                    'date',
                ],
                where: {
                    date: {
                        [Op.lt]: todayMidnightTime,
                        [Op.gte]: aMonthAgo,
                    },
                },
                order: [['date', 'DESC']],
                raw: true,
            });
            const todayId =
                (((todayMidnightTime.getTime() / 1000) | 0) / 86400) | 0;
            const aMonthAgoId =
                (((aMonthAgo.getTime() / 1000) | 0) / 86400) | 0;
            const ubiDaily = await getUbiDailyEntity(
                `id_gte: ${aMonthAgoId}, id_lt: ${todayId}`
            );
            const totalUbi = (await getUbiDailyEntity(`id: 0`))[0];

            const result = ubiDaily.reduce(
                (acc, el) => {
                    acc.backers += el.contributors;
                    acc.funding += Number(el.contributed);
                    acc.reach += el.reach;
                    return acc;
                },
                { backers: 0, funding: 0, reach: 0 }
            );
            const givingRate = parseFloat(
                new BigNumber(result.funding)
                    .dividedBy(result.backers)
                    .dividedBy(30)
                    .decimalPlaces(2, 1)
                    .toString()
            );

            return ubiDaily.map((ubi) => {
                const globalDaily = globalDailyState.find((el) => {
                    return (
                        Number(ubi.id) ===
                        new Date(el.date).getTime() / 1000 / 86400
                    );
                });
                const date = new Date(Number(ubi.id) * 86400 * 1000);
                return {
                    date: date.toISOString().split('T')[0] as any,
                    monthReach: result.reach,
                    avgMedianSSI: 0,
                    claimed: new BigNumber(ubi.claimed)
                        .multipliedBy(10 ** config.cUSDDecimal)
                        .toString(),
                    claims: ubi.claims,
                    beneficiaries: ubi.beneficiaries,
                    raised: new BigNumber(ubi.contributed)
                        .multipliedBy(10 ** config.cUSDDecimal)
                        .toString(),
                    backers: ubi.contributors,
                    volume: new BigNumber(ubi.volume)
                        .multipliedBy(10 ** config.cUSDDecimal)
                        .toString(),
                    transactions: ubi.transactions,
                    reach: ubi.reach,
                    reachOut: 0,
                    totalRaised: new BigNumber(totalUbi.contributed)
                        .multipliedBy(10 ** config.cUSDDecimal)
                        .toString(),
                    totalDistributed: new BigNumber(totalUbi.claimed)
                        .multipliedBy(10 ** config.cUSDDecimal)
                        .toString(),
                    totalBackers: totalUbi.contributors,
                    totalBeneficiaries: totalUbi.beneficiaries,
                    givingRate,
                    ubiRate: globalDaily?.ubiRate || 0,
                    spendingRate: 0,
                    avgComulativeUbi: globalDaily?.avgComulativeUbi || '0',
                    avgUbiDuration: globalDaily?.avgUbiDuration  || 0,
                    fundingRate: Number(Number(ubi.fundingRate).toFixed(2)),
                    totalVolume: new BigNumber(totalUbi.volume)
                        .multipliedBy(10 ** config.cUSDDecimal)
                        .toString(),
                    totalTransactions: totalUbi.transactions.toString() as any,
                    totalReach: totalUbi.reach.toString() as any,
                    totalReachOut: '0' as any,
                };
            });
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async last90DaysAvgSSI(): Promise<
        { date: Date; avgMedianSSI: number }[]
    > {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // 90 days ago, from todayMidnightTime
        const threeMonthsAgo = new Date(
            todayMidnightTime.getTime() - 7776000000
        ); // 90 * 24 * 60 * 60 * 1000
        const result = await this.globalDailyState.findAll({
            attributes: ['date', 'avgMedianSSI'],
            where: {
                date: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: threeMonthsAgo,
                },
            },
            order: [['date', 'DESC']],
            raw: true,
        });
        // it was null just once at the system's begin.
        return result.map((g) => ({
            date: g.date,
            avgMedianSSI: g.avgMedianSSI,
        }));
    }

    public async notYetCountedToday() {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const dayId = (((today.getTime() / 1000) | 0) / 86400) | 0;
        const ubiDaily = await getUbiDailyEntity(`id: ${dayId}`);

        // TODO: subtract removed

        return {
            totalClaimed: new BigNumber(ubiDaily[0].claimed)
                .multipliedBy(10 ** config.cUSDDecimal)
                .toString(),
            totalRaised: new BigNumber(ubiDaily[0].contributed)
                .multipliedBy(10 ** config.cUSDDecimal)
                .toString(),
            totalBeneficiaries: ubiDaily[0].beneficiaries || 0,
        };
    }
}
