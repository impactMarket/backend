'use strict';
const { ethers } = require('ethers');
const { faker } = require('@faker-js/faker');

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
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
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
                firstName: {
                    type: Sequelize.STRING(128),
                },
                lastName: {
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
                tableName: 'app_user',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        await User.bulkCreate(newUsers);
    },
};
