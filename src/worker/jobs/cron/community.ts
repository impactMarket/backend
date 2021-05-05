import { CommunityAttributes } from '@models/ubi/community';
import UserService from '@services/app/user';
import NotifiedBackerService from '@services/notifiedBacker';
import CommunityService from '@services/ubi/community';
import CommunityDailyStateService from '@services/ubi/communityDailyState';
import CommunityStateService from '@services/ubi/communityState';
import InflowService from '@services/ubi/inflow';
import { Logger } from '@utils/logger';
import { notifyBackersCommunityLowFunds } from '@utils/util';
import BigNumber from 'bignumber.js';
import { median, mean } from 'mathjs';
import { col, fn, Op, QueryTypes } from 'sequelize';

import config from '../../../config';
import { models, sequelize } from '../../../database';

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
                            },
                        ],
                    },
                ],
            },
        ],
        where: {
            status: 'valid',
            visibility: 'public',
        },
    });
    for (let c = 0; c < communities.length; c++) {
        const community = communities[c].toJSON() as CommunityAttributes;
        if (community.beneficiaries && community.beneficiaries.length > 0) {
            const suspectBeneficiaries = community.beneficiaries.filter(
                (b) =>
                    b.user &&
                    b.user.throughTrust &&
                    b.user.throughTrust.length > 0 &&
                    b.user.throughTrust.filter((tt) => tt.suspect).length > 0
            );
            if (suspectBeneficiaries.length === 0) {
                continue;
            }
            // in case it's 100%
            const ps =
                suspectBeneficiaries.length === community.beneficiaries.length
                    ? 100
                    : (suspectBeneficiaries.length /
                          community.beneficiaries.length) *
                      100;
            const y = 60 * Math.log(ps);
            const suspectLevel = Math.round(Math.min(y, 100) / 10);
            // save suspect level
            await models.ubiCommunitySuspect.create(
                {
                    communityId: community.id,
                    percentage: Math.round(ps * 100) / 100,
                    suspect: suspectLevel,
                },
                { returning: false }
            );
        }
    }
}

export async function calcuateCommunitiesMetrics(): Promise<void> {
    const aMonthAgo = new Date();
    aMonthAgo.setDate(aMonthAgo.getDate() - 30);
    aMonthAgo.setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const communitiesStatePre = await models.community.findAll({
        attributes: ['id', 'started'],
        include: [
            {
                model: models.ubiCommunityContract,
                as: 'contract',
            },
            {
                model: models.ubiCommunityState,
                as: 'state',
                where: {
                    claimed: { [Op.ne]: 0 },
                    raised: { [Op.ne]: 0 },
                    beneficiaries: { [Op.gt]: 1 },
                },
            },
            {
                model: models.ubiCommunityDailyMetrics,
                as: 'metrics',
                attributes: ['ssi'],
                required: false,
                order: [['date', 'DESC']],
                limit: 4,
            },
            {
                model: models.beneficiary,
                as: 'beneficiaries',
                where: {
                    claims: { [Op.gt]: 1 },
                    lastClaimAt: { [Op.gte]: aMonthAgo },
                    active: true,
                },
            },
        ],
        where: {
            status: 'valid',
            visibility: 'public',
        },
        order: [['id', 'DESC']],
    });
    const communityNumbers: any = await models.community.findAll({
        attributes: [
            'id',
            [
                fn('count', fn('distinct', col('beneficiaries.address'))),
                'count',
            ],
            [
                fn('sum', fn('coalesce', col('beneficiaries.claim.amount'), 0)),
                'sum',
            ],
        ],
        include: [
            {
                model: models.beneficiary,
                as: 'beneficiaries',
                where: {
                    claims: { [Op.gt]: 1 },
                    lastClaimAt: { [Op.gte]: aMonthAgo },
                    active: true,
                },
                attributes: [],
                required: false,
                include: [
                    {
                        model: models.claim,
                        as: 'claim',
                        attributes: [],
                        required: false,
                        where: {
                            txAt: { [Op.gte]: aMonthAgo },
                        },
                    },
                ],
            },
        ],
        where: {
            status: 'valid',
            visibility: 'public',
        },
        group: ['Community.id'],
        order: [['id', 'DESC']],
        raw: true,
    });

    const communitiesState = communitiesStatePre.map(
        (c) => c.toJSON() as CommunityAttributes
    );
    const communities: (CommunityAttributes & {
        beneficiariesClaiming: { count: number; claimed: string };
    })[] = [];
    for (let index = 0; index < communitiesState.length; index++) {
        const cn = communityNumbers.find(
            (c) => c.id === communitiesState[index].id
        )!;
        communities.push({
            ...communitiesState[index],
            beneficiariesClaiming: {
                count: parseInt(cn.count, 10),
                claimed: cn.sum,
            },
        });
    }

    // const someEconomicActivity = await models.beneficiaryTransaction.findAll({
    //     attributes: {
    //         exclude: [
    //             'id',
    //             'beneficiary',
    //             'withAddress',
    //             'amount',
    //             'isFromBeneficiary',
    //             'tx',
    //             'date',
    //             'createdAt',
    //             'updatedAt',
    //         ],
    //         include: [
    //             [fn('count', col('amount')), 'txs'],
    //             [fn('sum', col('amount')), 'volume'],
    //             [fn('count', fn('distinct', col('withAddress'))), 'reach'],
    //         ],
    //     },
    //     include: [
    //         {
    //             model: models.beneficiary,
    //             as: 'beneficiaryInTx',
    //             attributes: {
    //                 exclude: [
    //                     'id',
    //                     'address',
    //                     'communityId',
    //                     'active',
    //                     'blocked',
    //                     'tx',
    //                     'txAt',
    //                     'claims',
    //                     'claimed',
    //                     'lastClaimAt',
    //                     'penultimateClaimAt',
    //                     'createdAt',
    //                     'updatedAt',
    //                 ],
    //             },
    //             include: [
    //                 {
    //                     model: models.community,
    //                     as: 'community',
    //                     attributes: ['id'],
    //                     where: {
    //                         status: 'valid',
    //                         visibility: 'public',
    //                     },
    //                 },
    //             ],
    //         },
    //     ],
    //     group: ['beneficiaryInTx->community.id'],
    //     // raw: true,
    // });
    // TODO: tests cant query with sequelize query!
    const resultEconomicActivity: {
        volume: string;
        txs: string;
        reach: string;
        id: string;
    }[] = await sequelize.query(
        'select sum(bt.amount) volume, count(bt.amount) txs, count(distinct bt."withAddress") reach, c.id from beneficiarytransaction bt left join beneficiary b on bt.beneficiary = b.address left join community c on b."communityId" = c."publicId" where bt.date = ? group by c.id',
        {
            replacements: [yesterday.toISOString().split('T')[0]],
            raw: true,
            type: QueryTypes.SELECT,
        }
    );
    const economicActivity = new Map(
        resultEconomicActivity.map((r) => [parseInt(r.id, 10), r])
    );

    const calculateMetrics = async (
        community: CommunityAttributes & {
            beneficiariesClaiming: { count: number; claimed: string };
        }
    ) => {
        // if no activity, do not calculate
        if (
            community.state === undefined ||
            community.contract === undefined ||
            community.beneficiaries === undefined ||
            community.metrics === undefined ||
            community.beneficiariesClaiming.claimed === '0'
        ) {
            return;
        }
        // if (
        //     community.state.claimed === '0' ||
        //     community.state.raised === '0' ||
        //     totalClaimedLast30Days.get(community.id) === undefined ||
        //     activeBeneficiariesLast30Days.get(community.publicId) ===
        //         undefined ||
        //     activeBeneficiariesLast30Days.get(community.publicId) === 0
        // ) {
        //     return;
        // }
        // const beneficiaries = await BeneficiaryService.listActiveInCommunity(
        //     community.publicId
        // );
        // if (beneficiaries.length < 1) {
        //     return;
        // }
        let ssiDayAlone: number = 0;
        let ssi: number = 0;
        let ubiRate: number = 0;
        let estimatedDuration: number = 0;

        const beneficiariesTimeToWait: number[] = [];
        const beneficiariesTimeWaited: number[] = [];

        for (const beneficiary of community.beneficiaries) {
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
        const ssisAvailable = community.metrics.map((m) => m.ssi);
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
            (new Date().getTime() - new Date(community.started).getTime()) /
                86400000
        ); // 86400000 1 days in ms
        if (daysSinceStart > 30) {
            daysSinceStart = 30;
        }

        // calculate ubiRate
        ubiRate = parseFloat(
            new BigNumber(community.beneficiariesClaiming.claimed)
                .dividedBy(10 ** config.cUSDDecimal) // set 18 decimals from onchain values
                .dividedBy(community.beneficiariesClaiming.count)
                .dividedBy(daysSinceStart)
                .toFixed(2, 1)
        );

        // calculate estimatedDuration
        estimatedDuration = parseFloat(
            new BigNumber(community.contract.maxClaim)
                .dividedBy(10 ** config.cUSDDecimal) // set 18 decimals from onchain values
                .dividedBy(ubiRate)
                .dividedBy(30)
                .toFixed(2, 1)
        );
        console.log(
            community.id,
            ssiDayAlone,
            ssi,
            ubiRate,
            estimatedDuration,
            // since it's calculated post-midnight, save it with yesterdayDateOnly's date
            // yesterday
            new Date().getDate() - 1
        );
        await models.ubiCommunityDailyMetrics.create({
            communityId: community.id,
            ssiDayAlone,
            ssi,
            ubiRate,
            estimatedDuration,
            date: yesterday,
        });
        const economic = economicActivity.get(community.id);
        if (economic) {
            await models.ubiCommunityDailyState.update(
                {
                    transactions: parseInt(economic.txs, 10),
                    reach: parseInt(economic.reach, 10),
                    volume: economic.volume,
                },
                { where: { communityId: community.id, date: yesterday } }
            );
        }
    };

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
