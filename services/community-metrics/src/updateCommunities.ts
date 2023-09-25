import { database, utils, subgraph, config } from '@impactmarket/core';
import { getAddress } from '@ethersproject/address';

export async function updateCommunities(): Promise<void> {
    utils.Logger.info('Updating communities...');
    const { subgraphCommunity } = database.models;
    const t = await database.sequelize.transaction();

    try {
        const lastUpdate = await subgraphCommunity.findOne({
            attributes: ['updatedAt'],
            order: [['updatedAt', 'DESC']]
        });

        const entityLastUpdated = lastUpdate ? (lastUpdate.updatedAt.getTime() / 1000) | 0 : undefined;

        const communities = await subgraph.queries.community.communityEntities(
            `first: 1000,
            ${entityLastUpdated ? `where: { lastActivity_gt: ${entityLastUpdated} }` : ''}`,
            `id, estimatedFunds, beneficiaries, claims, claimed, beneficiaries, removedBeneficiaries, contributed, contributors, managers, baseInterval, state`
        );

        await Promise.all(communities.map(community => {
            return subgraphCommunity
                .findOne({ where: { communityAddress: getAddress(community.id) } })
                .then(subgraphCommunityModel => {
                    community['communityAddress'] = getAddress(community.id);
                    delete community.id;

                    if(subgraphCommunityModel) {
                        return subgraphCommunityModel.update(community, { transaction: t });
                    }
                    return subgraphCommunity.create(community, { transaction: t });
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