import { services, config, database } from '@impactmarket/core';
import { WebClient } from '@slack/web-api';
import BigNumber from 'bignumber.js';
import { Op } from 'sequelize';

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
