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
                trust: {
                    phone: faker.phone.phoneNumber(),
                },
            });
        }

        const User = await queryInterface.sequelize.define(
            'user',
            {
                address: {
                    type: Sequelize.STRING(44),
                    primaryKey: true,
                    allowNull: false,
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

        const AppUserTrust = await queryInterface.sequelize.define(
            'app_user_trust',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                phone: {
                    // hashed phone number
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                verifiedPhoneNumber: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                },
                suspect: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                },
            },
            {
                tableName: 'app_user_trust',
                sequelize: queryInterface.sequelize, // this bit is important
                timestamps: false,
            }
        );

        const AppUserThroughTrust = await queryInterface.sequelize.define(
            'app_user_through_trust',
            {
                userAddress: {
                    type: Sequelize.STRING(44),
                    references: {
                        model: 'user',
                        key: 'address',
                    },
                    onDelete: 'CASCADE',
                    allowNull: false,
                },
                appUserTrustId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: 'app_user_trust',
                        key: 'id',
                    },
                    onDelete: 'CASCADE',
                    allowNull: false,
                },
            },
            {
                tableName: 'app_user_through_trust',
                sequelize: queryInterface.sequelize, // this bit is important
                timestamps: false,
            }
        );

        User.belongsToMany(AppUserTrust, {
            through: AppUserThroughTrust,
            foreignKey: 'userAddress',
            sourceKey: 'address',
            as: 'trust',
        });

        await User.bulkCreate(newUsers, {
            include: [
                {
                    model: AppUserTrust,
                    as: 'trust',
                },
            ],
        });
    },
};
