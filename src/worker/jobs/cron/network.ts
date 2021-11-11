import { ethers } from 'ethers';
import { col, fn, Op } from 'sequelize';

import config from '../../../config';
import { models } from '../../../database';
import { filterMerkleTree } from './filters/merkleTree';

export async function cleanupNetworkRewards() {
    // get all "withAddress" for a given day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getDate() - 1);
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    let interactedAddress: { rows: any[]; count: number } = {
        rows: [],
        count: 0,
    };
    let offset = 0;
    // batch in groups of 500 addresses at a time
    do {
        interactedAddress =
            await models.ubiBeneficiaryTransaction.findAndCountAll({
                attributes: [[fn('distinct', col('withAddress')), 'addresses']],
                where: {
                    txAt: {
                        [Op.between]: [yesterday, today],
                    },
                },
                raw: true,
                offset,
                limit: 500,
            });
        // filter to find which ones are mekrle tree
        const merkleTrees = await filterMerkleTree(
            provider,
            interactedAddress.rows.map((t: any) => t.addresses)
        );
        // remove merkle trees
        await models.ubiBeneficiaryTransaction.destroy({
            where: {
                txAt: {
                    [Op.between]: [yesterday, today],
                },
                withAddress: {
                    [Op.in]: merkleTrees,
                },
            },
        });
        offset += 500;
    } while (
        interactedAddress.count > 500 &&
        interactedAddress.rows.length === 500
    );
}
