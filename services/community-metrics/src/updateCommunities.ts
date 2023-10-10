import { database, utils, subgraph, config } from '@impactmarket/core';
import { getAddress } from '@ethersproject/address';

export async function updateCommunities(): Promise<void> {
    utils.Logger.info('Updating communities...');
    const { subgraphUBICommunity } = database.models;
    const t = await database.sequelize.transaction();

    try {
        const lastUpdate = await subgraphUBICommunity.findOne({
            attributes: ['updatedAt'],
            order: [['updatedAt', 'DESC']]
        });

        const entityLastUpdated = lastUpdate ? (lastUpdate.updatedAt.getTime() / 1000) | 0 : undefined;

        const communities = await subgraph.queries.community.communityEntities(
            `first: 1000,
            ${entityLastUpdated ? `where: { lastActivity_gt: ${entityLastUpdated} }` : ''}`,
            `id, estimatedFunds, beneficiaries, claims, claimed, beneficiaries, removedBeneficiaries, contributed, contributors, managers, baseInterval, state, claimAmount, originalClaimAmount, maxClaim`
        );

        await Promise.all(communities.map(community => {
            return subgraphUBICommunity
                .findOne({ where: { communityAddress: getAddress(community.id) } })
                .then(model => {
                    community['communityAddress'] = getAddress(community.id);
                    delete community.id;

                    if(model) {
                        return subgraphUBICommunity.update(community, {
                            where: { id: model.id },
                            transaction: t,
                        }) as any;
                    }
                    return subgraphUBICommunity.create(community, { transaction: t });
                })
        }));

        await t.commit();
        utils.Logger.info('Communities updated!');
    } catch (error) {
        await t.rollback();
        utils.Logger.error('Error update communities: ', error);
        utils.slack.sendSlackMessage('🚨 Error to update communities', config.slack.lambdaChannel);
    }
}