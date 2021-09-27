import { CommunityAttributes } from '@models/ubi/community';
import UserService from '@services/app/user';
import NotifiedBackerService from '@services/notifiedBacker';
import CommunityService from '@services/ubi/community';
import CommunityStateService from '@services/ubi/communityState';
import InflowService from '@services/ubi/inflow';
import { WebClient } from '@slack/web-api';
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
                        model: models.appUser,
                        as: 'user',
                        include: [
                            {
                                model: models.appUserTrust,
                                as: 'trust',
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
                (b) => b.user && b.user.suspect
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
            monthlyBackers: string;
            volume: string;
            txs: string;
            reach: string;
            reachOut: string;
            fundingRate: string;
            beneficiaries: number;
        };
    };

    const aMonthAgo = new Date();
    aMonthAgo.setDate(aMonthAgo.getDate() - 30);
    aMonthAgo.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

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
                    raised: { [Op.ne]: 0 },
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
                required: false,
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
                        model: models.ubiClaim,
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
                        model: models.ubiClaim,
                        as: 'claim',
                        attributes: [],
                        required: false,
                        where: {
                            txAt: { [Op.between]: [yesterday, today] },
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
    })) as any;

    const communityNewBeneficiaryActivity: {
        id: string;
        beneficiaries: string;
    }[] = (await models.community.findAll({
        attributes: [
            'id',
            [fn('count', col('beneficiaries.address')), 'beneficiaries'],
        ],
        include: [
            {
                model: models.beneficiary,
                as: 'beneficiaries',
                attributes: [],
                required: false,
                where: {
                    txAt: { [Op.between]: [yesterday, today] },
                },
            },
        ],
        where: {
            status: 'valid',
            visibility: 'public',
        } as any,
        group: ['Community.id'],
        order: [['id', 'DESC']],
        raw: true,
    })) as any;

    const communityRemovedBeneficiaryActivity: {
        id: string;
        beneficiaries: string;
    }[] = (await models.community.findAll({
        attributes: [
            'id',
            [fn('count', col('beneficiaries.address')), 'beneficiaries'],
        ],
        include: [
            {
                model: models.beneficiary,
                as: 'beneficiaries',
                attributes: [],
                required: false,
                where: {
                    updatedAt: { [Op.between]: [yesterday, today] },
                    active: false,
                },
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
                where: {
                    txAt: { [Op.between]: [yesterday, today] },
                },
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

    const communityInflowMonthlyActivity: {
        id: string;
        monthlyBackers: string;
    }[] = (await models.community.findAll({
        attributes: [
            'id',
            [
                fn('count', fn('distinct', col('inflow."from"'))),
                'monthlyBackers',
            ],
        ],
        include: [
            {
                model: models.inflow,
                as: 'inflow',
                attributes: [],
                required: false,
                where: {
                    txAt: { [Op.between]: [aMonthAgo, today] },
                },
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
                        attributes: [],
                        required: false,
                        where: {
                            date: { [Op.between]: [yesterday, today] },
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
                        model: models.ubiClaim,
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
        const cima = communityInflowMonthlyActivity.find(
            (c) => parseInt(c.id, 10) === communitiesState[index].id
        );
        const cea = communityEconomicActivity.find(
            (c) => parseInt(c.id, 10) === communitiesState[index].id
        );
        const cm = communityMonthly.find(
            (c) => parseInt(c.id, 10) === communitiesState[index].id
        );
        const cnb = communityNewBeneficiaryActivity.find(
            (c) => parseInt(c.id, 10) === communitiesState[index].id
        );
        const crb = communityRemovedBeneficiaryActivity.find(
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
                ...(cima ? cima : { monthlyBackers: '0' }),
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
                ...(cnb && crb
                    ? {
                          beneficiaries:
                              parseInt(cnb.beneficiaries, 10) -
                              parseInt(crb.beneficiaries, 10),
                      }
                    : { beneficiaries: 0 }),
            },
        });
    }

    const calculateMetrics = async (community: ICommunityToMetrics) => {
        //
        if (community.activity !== undefined) {
            await models.ubiCommunityDailyState.create({
                transactions: parseInt(community.activity.txs, 10),
                reach: parseInt(community.activity.reach, 10),
                reachOut: parseInt(community.activity.reachOut, 10),
                volume: community.activity.volume,
                backers: parseInt(community.activity.backers, 10),
                monthlyBackers: parseInt(community.activity.monthlyBackers, 10),
                raised: community.activity.raised,
                claimed: community.activity.claimed,
                claims: parseInt(community.activity.claims, 10),
                fundingRate: parseFloat(community.activity.fundingRate),
                beneficiaries: community.activity.beneficiaries,
                communityId: community.id,
                date: yesterday,
            });
        }
        // if no activity, do not calculate
        if (
            community.state === undefined ||
            community.contract === undefined ||
            community.beneficiaries === undefined ||
            community.beneficiaries.length === 0 ||
            community.metrics === undefined ||
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
    };

    const pending: Promise<void>[] = [];
    // for each community
    for (let index = 0; index < communities.length; index++) {
        pending.push(calculateMetrics(communities[index]));
    }
    await Promise.all(pending);
}

export async function internalNotifyLowCommunityFunds(): Promise<void> {
    const web = new WebClient(config.slackApi);

    const communitiesOrdered = await CommunityService.list({
        orderBy: 'out_of_funds',
        offset: '0',
        limit: '10',
    });

    let result = '';

    const communities = communitiesOrdered.rows;

    for (let index = 0; index < communities.length; index++) {
        const community = communities[index];
        if (
            community.state &&
            community.state.backers > 0 &&
            community.state.claimed !== '0' &&
            community.state.beneficiaries > 1
        ) {
            const onContract = parseFloat(
                new BigNumber(community.state.raised)
                    .minus(community.state.claimed)
                    .div(10 ** 18)
                    .toString()
            );

            if (onContract < 150) {
                result += `\n\n($${Math.round(onContract)}) -> ${
                    community.name
                } | <http://${
                    community.contractAddress
                }|Copy address to clipboard> [${community.contractAddress}]`;
            }
        }
    }

    if (result.length > 0) {
        await web.chat.postMessage({
            channel: 'communities-funds',
            text: result,
            mrkdwn: true,
        });
    }
}

export async function internalNotifyNewCommunities(): Promise<void> {
    const web = new WebClient(config.slackApi);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const totalPending = await models.community.findAndCountAll({
        where: { createdAt: { [Op.gte]: sevenDaysAgo }, status: 'pending' },
        order: ['review'],
    });
    const pending = await models.community.count({
        where: {
            createdAt: { [Op.gte]: sevenDaysAgo },
            status: 'pending',
            review: 'pending',
        },
    });
    const inReview = await models.community.count({
        where: {
            createdAt: { [Op.gte]: sevenDaysAgo },
            status: 'pending',
            review: 'in-progress',
        },
    });
    const halted = await models.community.count({
        where: {
            createdAt: { [Op.gte]: sevenDaysAgo },
            status: 'pending',
            review: 'halted',
        },
    });
    const closed = await models.community.count({
        where: {
            createdAt: { [Op.gte]: sevenDaysAgo },
            status: 'pending',
            review: 'closed',
        },
    });

    if (totalPending.count > 0) {
        const post = await web.chat.postMessage({
            channel: 'communities_onboarding',
            text: `Last week ${totalPending.count} community request were created. Of which ${pending} are pending, ${inReview} are in review, ${halted} halted, and ${closed} closed.`,
        });
        await web.chat.postMessage({
            channel: 'communities_onboarding',
            thread_ts: post.ts,
            blocks: totalPending.rows.map((r) => ({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `Review Status: ${r.review}\nCountry: ${r.country}\nName: ${r.name}\nDescription: ${r.description}`,
                },
            })),
        });
    }
}
