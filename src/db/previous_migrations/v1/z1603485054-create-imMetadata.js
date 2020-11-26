'use strict';
const { ethers } = require("ethers");

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('immetadata', {
            key: {
                type: Sequelize.STRING(128),
                unique: true,
                primaryKey: true,
            },
            value: {
                type: Sequelize.STRING(512),
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            }
        });
        const provider = new ethers.providers.JsonRpcProvider(process.env.CHAIN_JSON_RPC_URL);
        const blockNumber = await provider.getBlockNumber();
        return queryInterface.bulkInsert('immetadata', [
            {
                key: 'lastBlock',
                value: blockNumber.toString(),
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('immetadata');
    }
};