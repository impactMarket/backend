import {
    interfaces,
    services,
    config,
    database,
    subgraph,
} from '@impactmarket/core';
import { BeneficiarySubgraph } from '@impactmarket/core/src/subgraph/interfaces/beneficiary';
import { WebClient } from '@slack/web-api';
import BigNumber from 'bignumber.js';
import { median, mean } from 'mathjs';
import { col, fn, literal, Op, QueryTypes } from 'sequelize';

export async function verifyCommunitySuspectActivity(): Promise<void> {
    const query = `
    WITH
        communities AS (
        SELECT "Community"."id",
            count(*) filter ( where suspect is true ) AS "suspect",
            count(*) as "total"
        FROM "community" AS "Community"
            INNER JOIN "beneficiary" AS "beneficiaries" ON "Community"."id" = "beneficiaries"."communityId" AND "beneficiaries"."active" = true
            LEFT OUTER JOIN "app_user" AS "app_user" ON "beneficiaries"."address" = "app_user"."address"
        WHERE "Community"."status" = 'valid' AND "Community"."visibility" = 'public'
        GROUP BY "Community"."id"
        having count(*) filter ( where suspect is true ) > 0
    ),
    suspect_level AS (
        select ((communities.suspect::float / communities.total::float) * 100) as ps,
                (60 * log10(((communities.suspect::float / communities.total::float) * 100) + 1)) as y,
                id
        from communities
    )
    INSERT INTO ubi_community_suspect ("communityId", percentage, suspect)
    (select id as "communityId", (ROUND(ps * 100) / 100) as percentage, GREATEST(1, ROUND(LEAST(suspect_level.y, 100) / 10)) as suspect
    from suspect_level)`;

    await database.sequelize.query(query, {
        type: QueryTypes.INSERT,
    });
}

export async function calcuateCommunitiesMetrics(): Promise<void> {
    type ICommunityToMetrics = Omit<
        interfaces.ubi.community.CommunityAttributes,
        'beneficiaries'
    > & {
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

    const whereCommunity = {
        [Op.or]: [
            {
                status: 'valid',
            },
            {
                [Op.and]: [
                    { status: 'removed' },
                    { deletedAt: { [Op.between]: [yesterday, today] } },
                ],
            },
        ],
    };

    const communitiesStatePre = await database.models.community.findAll({
        attributes: ['id', 'started', 'contractAddress'],
        include: [
            {
                model: database.models.ubiCommunityContract,
                as: 'contract',
            },
            {
                model: database.models.ubiCommunityDailyMetrics,
                as: 'metrics',
                attributes: ['ssi'],
                required: false,
                order: [['date', 'DESC']],
                limit: 4,
            },
        ],
        where: {
            ...whereCommunity,
            visibility: 'public',
        },
        order: [['id', 'DESC']],
    });

    const communityNumbers: any = await database.models.community.findAll({
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
                model: database.models.beneficiary,
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
                        model: database.models.ubiClaim,
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
    }[] = (await database.models.community.findAll({
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
                model: database.models.beneficiary,
                as: 'beneficiaries',
                attributes: [],
                required: false,
                include: [
                    {
                        model: database.models.ubiClaim,
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
    }[] = (await database.models.community.findAll({
        attributes: [
            'id',
            [fn('count', col('beneficiaries.address')), 'beneficiaries'],
        ],
        include: [
            {
                model: database.models.beneficiary,
                as: 'beneficiaries',
                attributes: [],
                required: false,
                where: {
                    txAt: { [Op.between]: [yesterday, today] },
                },
            },
        ],
        where: {
            ...whereCommunity,
            visibility: 'public',
        } as any,
        group: ['Community.id'],
        order: [['id', 'DESC']],
        raw: true,
    })) as any;

    const communityRemovedBeneficiaryActivity: {
        id: string;
        beneficiaries: string;
    }[] = (await database.models.community.findAll({
        attributes: [
            'id',
            [fn('count', col('beneficiaries.address')), 'beneficiaries'],
        ],
        include: [
            {
                model: database.models.beneficiary,
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
            ...whereCommunity,
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
    }[] = (await database.models.community.findAll({
        attributes: [
            'id',
            [fn('sum', fn('coalesce', col('inflow.amount'), 0)), 'raised'],
            [fn('count', fn('distinct', col('inflow."from"'))), 'backers'],
        ],
        include: [
            {
                model: database.models.inflow,
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
    }[] = (await database.models.community.findAll({
        attributes: [
            'id',
            [
                fn('count', fn('distinct', col('inflow."from"'))),
                'monthlyBackers',
            ],
        ],
        include: [
            {
                model: database.models.inflow,
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
    }[] = (await database.models.community.findAll({
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
                model: database.models.beneficiary,
                as: 'beneficiaries',
                attributes: [],
                required: false,
                include: [
                    {
                        model: database.models.ubiBeneficiaryTransaction,
                        as: 'transactions',
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

    const communityMonthly: {
        id: string;
        claimed: string;
        raised: string;
    }[] = (await database.models.community.findAll({
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
                model: database.models.beneficiary,
                as: 'beneficiaries',
                attributes: [],
                required: false,
                include: [
                    {
                        model: database.models.ubiClaim,
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
                model: database.models.inflow,
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
        (c) => c.toJSON() as interfaces.ubi.community.CommunityAttributes
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

    const calculateMetrics = async (communities: ICommunityToMetrics[]) => {
        const subGraphPromises: Promise<any>[] = [];

        communities.forEach(community => {
            subGraphPromises.push(subgraph.queries.beneficiary.getBeneficiaries(community.contractAddress!))
        });

        let beneficiaries = await Promise.all(subGraphPromises);
        // organize subgraph return
        beneficiaries = beneficiaries.reduce((acc: BeneficiarySubgraph[], el) => {
            if(el && el.length) {
                acc.push(...el);
            }
            return acc;
        }, []);

        const dailyStatePromises: Promise<any>[] = [];
        const dailyMetricsPromises: Promise<any>[] = [];
        communities.forEach(community => {
            //
            if (community.activity !== undefined) {
                dailyStatePromises.push(database.models.ubiCommunityDailyState.create({
                    transactions: parseInt(community.activity.txs, 10),
                    reach: parseInt(community.activity.reach, 10),
                    reachOut: parseInt(community.activity.reachOut, 10),
                    volume: community.activity.volume,
                    backers: parseInt(community.activity.backers, 10),
                    monthlyBackers: parseInt(
                        community.activity.monthlyBackers,
                        10
                    ),
                    raised: community.activity.raised,
                    claimed: community.activity.claimed,
                    claims: parseInt(community.activity.claims, 10),
                    fundingRate: parseFloat(community.activity.fundingRate),
                    beneficiaries: community.activity.beneficiaries,
                    communityId: community.id,
                    date: yesterday,
                }));
            }

            const beneficiaryList = beneficiaries.filter(
                (el) =>
                    el.community?.id ===
                    community.contractAddress?.toLowerCase()
            );
            // if no activity, do not calculate
            if (
                community.contract === undefined ||
                beneficiaryList === undefined ||
                beneficiaryList.length === 0 ||
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

            beneficiaryList.forEach(beneficiary => {
                if (
                    beneficiary.claims < 2 ||
                    beneficiary.lastClaimAt === null ||
                    beneficiary.preLastClaimAt === null
                ) {
                    return;
                }
                // the first time you don't wait a single second, the second time, only base interval
                if (community.contract === undefined) {
                    return;
                }
                const timeToWait =
                    community.contract.baseInterval +
                    (beneficiary.claims - 2) *
                        community.contract.incrementInterval;
                const timeWaited =
                    Math.floor(
                        beneficiary.lastClaimAt - beneficiary.preLastClaimAt
                    ) - timeToWait;
                //
                beneficiariesTimeToWait.push(timeToWait);
                beneficiariesTimeWaited.push(timeWaited);
            });

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
                (new Date().getTime() -
                    new Date(community.started).getTime()) /
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
            console.log('saving daily metrics');
            dailyMetricsPromises.push(database.models.ubiCommunityDailyMetrics.create({
                communityId: community.id,
                ssiDayAlone,
                ssi,
                ubiRate,
                estimatedDuration,
                date: yesterday,
            }));
        });

        await Promise.all(dailyStatePromises);
        await Promise.all(dailyMetricsPromises);
    };

    const pending: Promise<void>[] = [];
    const batch = 20;
    // for each community
    for (let i = 0; ; i = i + batch) {
        await calculateMetrics(communities.slice(i, i + batch));
        if (i + batch > communities.length) {
            break;
        }
    }
}

export async function internalNotifyLowCommunityFunds(): Promise<void> {
    const web = new WebClient(config.slackApi);

    const communitiesOrdered = await services.ubi.CommunityService.list({
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

    const totalPending = await database.models.community.findAndCountAll({
        where: { createdAt: { [Op.gte]: sevenDaysAgo }, status: 'pending' },
        order: ['review'],
    });
    const pending = await database.models.community.count({
        where: {
            createdAt: { [Op.gte]: sevenDaysAgo },
            status: 'pending',
            review: 'pending',
        },
    });
    const inReview = await database.models.community.count({
        where: {
            createdAt: { [Op.gte]: sevenDaysAgo },
            status: 'pending',
            review: 'in-progress',
        },
    });
    const halted = await database.models.community.count({
        where: {
            createdAt: { [Op.gte]: sevenDaysAgo },
            status: 'pending',
            review: 'halted',
        },
    });
    const closed = await database.models.community.count({
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
