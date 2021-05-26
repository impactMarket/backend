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
import { col, fn, literal, Op } from 'sequelize';

import config from '../../../config';
import { models } from '../../../database';

export async function verifyCommunitySuspectActivity(): Promise<void> {
    //
    const communities = await models.community.findAll({
        include: [
            {
                model: models.beneficiary,
                as: 'beneficiaries',
                where: {
                    active: true,
                },
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
            const y = 60 * Math.log(ps + 1);
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
    type ICommunityToMetrics = CommunityAttributes & {
        beneficiariesClaiming: { count: number; claimed: string };
        activity: {
            claimed: string;
            claims: string;
            raised: string;
            backers: string;
            volume: string;
            txs: string;
            reach: string;
            reachOut: string;
            fundingRate: string;
        };
    };

    const aMonthAgo = new Date();
    aMonthAgo.setDate(aMonthAgo.getDate() - 30);
    aMonthAgo.setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // query communities data

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

    const communityClaimActivity: {
        id: string;
        claimed: string;
        claims: string;
    }[] = (await models.community.findAll({
        attributes: [
            'id',
            [
                fn('sum', fn('coalesce', col('beneficiaries.claim.amount'), 0)),
                'claimed',
            ],
            [fn('count', col('beneficiaries.claim.tx')), 'claims'],
        ],
        include: [
            {
                model: models.beneficiary,
                as: 'beneficiaries',
                attributes: [],
                required: false,
                include: [
                    {
                        model: models.claim,
                        as: 'claim',
                        attributes: [],
                        required: false,
                        where: literal(
                            `date("beneficiaries->claim"."txAt") = '${
                                yesterday.toISOString().split('T')[0]
                            }'`
                        ),
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
    })) as any;

    const communityInflowActivity: {
        id: string;
        raised: string;
        backers: string;
    }[] = (await models.community.findAll({
        attributes: [
            'id',
            [fn('sum', fn('coalesce', col('inflow.amount'), 0)), 'raised'],
            [fn('count', fn('distinct', col('inflow."from"'))), 'backers'],
        ],
        include: [
            {
                model: models.inflow,
                as: 'inflow',
                attributes: [],
                required: false,
                where: literal(
                    `date(inflow."txAt") = '${
                        yesterday.toISOString().split('T')[0]
                    }'`
                ),
            },
        ],
        where: {
            status: 'valid',
            visibility: 'public',
        },
        group: ['Community.id'],
        order: [['id', 'DESC']],
        raw: true,
    })) as any;

    const communityEconomicActivity: {
        id: string;
        volume: string;
        txs: string;
        reach: string;
        reachOut: string;
    }[] = (await models.community.findAll({
        attributes: [
            'id',
            [
                fn(
                    'sum',
                    fn(
                        'coalesce',
                        col('"beneficiaries->transactions"."amount"'),
                        0
                    )
                ),
                'volume',
            ],
            [fn('count', col('"beneficiaries->transactions"."amount"')), 'txs'],
            [
                fn(
                    'count',
                    fn(
                        'distinct',
                        col('"beneficiaries->transactions"."withAddress"')
                    )
                ),
                'reach',
            ],
            [
                literal(
                    'count(distinct "beneficiaries->transactions"."withAddress") filter (where "beneficiaries->transactions"."withAddress" not in (select distinct address from beneficiary where active = true))'
                ),
                'reachOut',
            ],
        ],
        include: [
            {
                model: models.beneficiary,
                as: 'beneficiaries',
                attributes: [],
                required: false,
                include: [
                    {
                        model: models.beneficiaryTransaction,
                        as: 'transactions',
                        where: literal(
                            `date("beneficiaries->transactions"."date") = '${
                                yesterday.toISOString().split('T')[0]
                            }'`
                        ),
                        attributes: [],
                        required: false,
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
    })) as any;

    const communityMonthly: {
        id: string;
        claimed: string;
        raised: string;
    }[] = (await models.community.findAll({
        attributes: [
            'id',
            [
                fn('sum', fn('coalesce', col('beneficiaries.claim.amount'), 0)),
                'claimed',
            ],
            [fn('sum', fn('coalesce', col('inflow.amount'), 0)), 'raised'],
        ],
        include: [
            {
                model: models.beneficiary,
                as: 'beneficiaries',
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
            {
                model: models.inflow,
                as: 'inflow',
                attributes: [],
                required: false,
                where: {
                    txAt: { [Op.gte]: aMonthAgo },
                },
            },
        ],
        where: {
            status: 'valid',
            visibility: 'public',
            createdAt: { [Op.gte]: aMonthAgo },
        },
        group: ['Community.id'],
        order: [['id', 'DESC']],
        raw: true,
    })) as any;

    // build communities object
    const communitiesState = communitiesStatePre.map(
        (c) => c.toJSON() as CommunityAttributes
    );
    const communities: ICommunityToMetrics[] = [];
    for (let index = 0; index < communitiesState.length; index++) {
        const cn = communityNumbers.find(
            (c) => c.id === communitiesState[index].id
        );
        const cca = communityClaimActivity.find(
            (c) => parseInt(c.id, 10) === communitiesState[index].id
        );
        const cia = communityInflowActivity.find(
            (c) => parseInt(c.id, 10) === communitiesState[index].id
        );
        const cea = communityEconomicActivity.find(
            (c) => parseInt(c.id, 10) === communitiesState[index].id
        );
        const cm = communityMonthly.find(
            (c) => parseInt(c.id, 10) === communitiesState[index].id
        );
        communities.push({
            ...communitiesState[index],
            beneficiariesClaiming: cn
                ? {
                      count: parseInt(cn.count, 10),
                      claimed: cn.sum,
                  }
                : { count: 0, claimed: '0' },
            activity: {
                ...(cca ? cca : { claimed: '0', claims: '0' }),
                ...(cia ? cia : { raised: '0', backers: '0' }),
                ...(cea
                    ? cea
                    : { volume: '0', txs: '0', reach: '0', reachOut: '0' }),
                fundingRate: cm
                    ? new BigNumber(cm.raised)
                          .minus(cm.claimed)
                          .dividedBy(cm.raised)
                          .multipliedBy(100)
                          .toFixed(2, 1)
                    : '0',
            },
        });
    }

    const calculateMetrics = async (community: ICommunityToMetrics) => {
        // if no activity, do not calculate
        if (
            community.state === undefined ||
            community.contract === undefined ||
            community.beneficiaries === undefined ||
            community.metrics === undefined ||
            community.activity === undefined ||
            community.beneficiariesClaiming.claimed === '0'
        ) {
            return;
        }
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
            //
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
        //
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
        await models.ubiCommunityDailyMetrics.create({
            communityId: community.id,
            ssiDayAlone,
            ssi,
            ubiRate,
            estimatedDuration,
            date: yesterday,
        });
        await models.ubiCommunityDailyState.update(
            {
                transactions: parseInt(community.activity.txs, 10),
                reach: parseInt(community.activity.reach, 10),
                reachOut: parseInt(community.activity.reachOut, 10),
                volume: community.activity.volume,
                backers: parseInt(community.activity.backers, 10),
                raised: community.activity.raised,
                claimed: community.activity.claimed,
                claims: parseInt(community.activity.claims, 10),
                fundingRate: parseFloat(community.activity.fundingRate),
            },
            { where: { communityId: community.id, date: yesterday } }
        );
    };

    const pending: Promise<void>[] = [];
    // for each community
    for (let index = 0; index < communities.length; index++) {
        pending.push(calculateMetrics(communities[index]));
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
