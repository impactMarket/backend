import { ethers } from 'ethers';
import { col, fn, Op } from 'sequelize/types';

import config from '../../../config';
import { models } from '../../../database';
import { filterMerkleTree } from './filters/merkleTree';

export async function cleanupNetworkRewards() {
    // get all "withAddress" for a given day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getDate() - 1);
    const interactedAddressList: string[] = (
        await models.beneficiaryTransaction.findAll({
            attributes: [[fn('distinct', col('withAddress')), 'addresses']],
            where: {
                createdAt: {
                    [Op.between]: [yesterday, today],
                },
            },
            raw: true,
        })
    ).map((t: any) => t.addresses);
    // filter to find which ones are mekrle tree
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    const merkleTrees = await filterMerkleTree(provider, interactedAddressList);
    // remove merkle trees
    await models.beneficiaryTransaction.destroy({
        where: {
            createdAt: {
                [Op.between]: [yesterday, today],
            },
            withAddress: {
                [Op.in]: merkleTrees,
            },
        },
    });
}
