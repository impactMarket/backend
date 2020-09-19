'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('globalstatus', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            key: {
                type: Sequelize.STRING(32),
                allowNull: false
            },
            value: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
        return queryInterface.bulkInsert('globalstatus', [{
            key: 'totalraised',
            value: '0',
            createdAt: new Date(),
            updatedAt: new Date()
        },{
            key: 'totaldistributed',
            value: '0',
            createdAt: new Date(),
            updatedAt: new Date()
        },{
            key: 'totalbeneficiaries',
            value: '0',
            createdAt: new Date(),
            updatedAt: new Date()
        },{
            key: 'totalclaims',
            value: '0',
            createdAt: new Date(),
            updatedAt: new Date()
        },]);
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('globalstatus');
    }
};