'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('immetadata', [
            {
                key: 'queryFilterLastBlock',
                value: '2627647',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },
    down: (queryInterface) => {
    }
};