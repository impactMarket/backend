import { config, database } from '@impactmarket/core';
import { WebClient } from '@slack/web-api';
import { Op } from 'sequelize';

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
