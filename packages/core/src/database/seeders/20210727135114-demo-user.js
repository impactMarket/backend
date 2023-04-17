'use strict';
const { ethers } = require('ethers');
const faker = require('faker');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        if (process.env.API_ENVIRONMENT === 'production') {
            return;
        }
        const totalNewUsers = 50;
        const newUsers = [];
        for (let index = 0; index < totalNewUsers; index++) {
            const randomWallet = ethers.Wallet.createRandom();
            newUsers.push({
                address: await randomWallet.getAddress(),
                username: faker.internet.userName(),
                currency: faker.finance.currencyCode(),
            });
        }

        const User = await queryInterface.sequelize.define(
            'app_user',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                address: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                    unique: true,
                },
                avatarMediaId: {
                    type: Sequelize.INTEGER,
                    // references: {
                    //     model: 'app_media_content',
                    //     key: 'id',
                    // },
                    // // onDelete: 'SET NULL', // default
                    allowNull: true,
                },
                username: {
                    type: Sequelize.STRING(128),
                },
                language: {
                    type: Sequelize.STRING(8),
                    defaultValue: 'en',
                    allowNull: false,
                },
                currency: {
                    type: Sequelize.STRING(4),
                    defaultValue: 'USD',
                },
                pushNotificationToken: {
                    type: Sequelize.STRING(64),
                },
                gender: {
                    type: Sequelize.STRING(2),
                },
                year: {
                    type: Sequelize.INTEGER,
                },
                children: {
                    type: Sequelize.INTEGER,
                },
                lastLogin: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.fn('now'),
                    allowNull: false,
                },
                suspect: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                    allowNull: false,
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.fn('now'),
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.fn('now'),
                },
            },
            {
                tableName: 'user',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        await User.bulkCreate(newUsers);
    },
};
