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
        const lastGlobal = (await this.globalDailyState.findOne({
            order: [['date', 'DESC']],
        }))!; // only empty at the beginning
        return {
            claimed: new BigNumber(lastGlobal.totalDistributed)
                .div(10 ** config.cUSDDecimal)
                .toString(),
            countries,
            beneficiaries: lastGlobal.totalBeneficiaries,
            backers: lastGlobal.totalBackers,
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
        const result = await this.globalDailyState.findOne<any>({
            attributes: [
                [fn('sum', col('claimed')), 'tClaimed'],
                [fn('sum', col('claims')), 'tClaims'],
                [fn('sum', col('beneficiaries')), 'tBeneficiaries'],
                [fn('sum', col('raised')), 'tRaised'],
                [fn('sum', col('backers')), 'tBackers'],
                [fn('sum', col('transactions')), 'tTransactions'],
                [fn('sum', col('volume')), 'tVolume'],
                [fn('sum', col('reach')), 'tReach'],
                [fn('sum', col('reachOut')), 'tReachOut'],
            ],
            where: {
                date: {
                    [Op.lt]: from,
                    [Op.gte]: aMonthAgo,
                },
            },
            raw: true,
        });
        const frDate = new Date();
        frDate.setDate(from.getDate() - 1);
        const fr = await this.globalDailyState.findOne<any>({
            attributes: ['fundingRate'],
            where: {
                date: frDate,
            },
            raw: true,
        });
        return {
            tClaimed: result.tClaimed,
            tClaims: parseInt(result.tClaims, 10),
            tBeneficiaries: parseInt(result.tBeneficiaries, 10),
            tRaised: result.tRaised,
            tBackers: parseInt(result.tBackers, 10),
            fundingRate: parseInt(fr.fundingRate, 10),
            tVolume: result.tVolume,
            tTransactions: result.tTransactions,
            tReach: result.tReach,
            tReachOut: result.tReachOut,
        };
    }

    public getLast30Days(): Promise<GlobalDailyState[]> {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // 30 days ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        // it was null just once at the system's begin.
        return this.globalDailyState.findAll({
            where: {
                date: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: aMonthAgo,
                },
            },
            order: [['date', 'DESC']],
            raw: true,
        });
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

        const communitiesId = (
            await models.community.findAll({
                attributes: ['id'],
                where: { status: 'valid', visibility: 'public' },
            })
        ).map((c) => c.id);

        const claimed: any = await models.ubiClaim.findAll({
            attributes: [
                [fn('coalesce', fn('sum', col('amount')), '0'), 'totalClaimed'],
            ],
            where: {
                txAt: { [Op.gte]: today },
                communityId: { [Op.in]: communitiesId },
            },
            raw: true,
        });

        const raised: any = await models.inflow.findAll({
            attributes: [
                [fn('coalesce', fn('sum', col('amount')), '0'), 'totalRaised'],
            ],
            where: {
                txAt: { [Op.gte]: today },
                from: {
                    [Op.not]: config.contractAddresses.treasury,
                },
            },
            raw: true,
        });

        const ubiDaily = await getUbiDailyEntity(today);

        // TODO: subtract removed

        return {
            totalClaimed: claimed[0].totalClaimed,
            totalRaised: raised[0].totalRaised,
            totalBeneficiaries: ubiDaily.beneficiaries,
        };
    }
}
