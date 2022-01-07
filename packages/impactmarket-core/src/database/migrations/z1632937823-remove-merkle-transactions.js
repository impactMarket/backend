'use strict';
const { providers, Contract } = require('ethers');

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        const addresses = (await queryInterface.sequelize.query(
            `select "withAddress" from beneficiarytransaction
            group by "withAddress","isFromBeneficiary"
            having count("withAddress") > 600 and "isFromBeneficiary" = false
            order by count("withAddress");`, 
            {
                type: Sequelize.QueryTypes.SELECT,
            }
        )).map(el => el.withAddress);

        const MerkleABI = [
            {
                type: 'function',
                stateMutability: 'view',
                outputs: [{ type: 'bytes32', name: '', internalType: 'bytes32' }],
                name: 'merkleRoot',
                inputs: [],
            },
        ];
        
        const provider = new providers.JsonRpcProvider(process.env.CHAIN_JSON_RPC_URL);
        const trees = [];
        for (let index = 0; index < addresses.length; index++) {
            const merkle = new Contract(addresses[index], MerkleABI, provider);
            try {
                await merkle.merkleRoot();
                trees.push(`'${addresses[index]}'`);
            } catch (_) {
                // Merkle tree not found
            }
        }

        if(trees.length > 0) {
            await queryInterface.sequelize.query(`DELETE FROM beneficiarytransaction WHERE "withAddress" IN (${trees})`);
        }
    },

    down(queryInterface, Sequelize) {},
};
