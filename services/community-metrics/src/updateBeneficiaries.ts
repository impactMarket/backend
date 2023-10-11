import { database, utils, subgraph, config } from '@impactmarket/core';
import { getAddress } from '@ethersproject/address';
import { Transaction } from 'sequelize';

export async function updateBeneficiaries(): Promise<void> {
    utils.Logger.info('Updating beneficiaries...');
    const t = await database.sequelize.transaction();

    try {
        const lastUpdate = await database.models.subgraphUBIBeneficiary.findOne({
            attributes: ['updatedAt'],
            order: [['updatedAt', 'DESC']]
        });

        const entityLastUpdated = lastUpdate ? (lastUpdate.updatedAt.getTime() / 1000) | 0 : undefined;

        if (!entityLastUpdated) {
            await updateAllBeneficiaries(t);
        } else {
            await updateBeneficiariesState(entityLastUpdated, t);
        }
        
        await t.commit();
        utils.Logger.info('Beneficiaries updated!');
    } catch (error) {
        await t.rollback();
        utils.Logger.error('Error update beneficiaries: ', error);
        utils.slack.sendSlackMessage('🚨 Error to update beneficiaries', config.slack.lambdaChannel);
    }
}

async function updateBeneficiariesState(searchParam: number | string,  t: Transaction) {
    const { subgraphUBIBeneficiary } = database.models;
    const batchSize = config.cronJobBatchSize;
    let offset = 0;

    while (true) {
        const result = await subgraph.queries.beneficiary.getBeneficiaryState(
            `first: ${batchSize}
            skip: ${offset}
            ${typeof searchParam === 'number'
                ? `where: { lastActivity_gt: ${searchParam} }`
                : `where: { community:"${searchParam.toLowerCase()}" }`}`,
            `
                address
                community {
                    id
                }
                since
                claimed
                state
            `
        );

        const beneficiaries = result || [];

        if (beneficiaries.length === 0) {
            break;
        }

        offset += batchSize;

        await Promise.all(beneficiaries.map(beneficiary => {
            return subgraphUBIBeneficiary
                .findOne({ where: { userAddress: getAddress(beneficiary.address) } })
                .then(async (model) => {
                    beneficiary['communityAddress'] = getAddress(beneficiary.community.id);
                    beneficiary['userAddress'] = getAddress(beneficiary.address);
    
                    if(model) {
                        await subgraphUBIBeneficiary.update(beneficiary as any, {
                            where: { id: model.id },
                            transaction: t,
                        }) as any;
                    }
                    await subgraphUBIBeneficiary.create(beneficiary as any, { transaction: t });

                    utils.cache.cleanBeneficiaryCache(beneficiary.community.id);
                    utils.cache.cleanUserRolesCache(beneficiary.address);
                })
        }));
    }
}

async function updateAllBeneficiaries(t: Transaction) {
    const { community } = database.models;
    const communities = await community.findAll({
        attributes: ['contractAddress'],
        where: {
            status: 'valid',
            visibility: 'public'
        }
    });

    for (let index = 0; index < communities.length; index++) {
        const community = communities[index];
        await updateBeneficiariesState(community.contractAddress!, t);
    }
}