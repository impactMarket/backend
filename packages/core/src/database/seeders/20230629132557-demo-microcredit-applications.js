'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        if (process.env.API_ENVIRONMENT === 'production') {
            return;
        }
        const User = await queryInterface.sequelize.define(
            'app_user',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                address: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                    unique: true
                },
                firstName: {
                    type: Sequelize.STRING(128)
                },
                lastName: {
                    type: Sequelize.STRING(128)
                },
                language: {
                    type: Sequelize.STRING(8),
                    defaultValue: 'en',
                    allowNull: false
                },
                currency: {
                    type: Sequelize.STRING(4),
                    defaultValue: 'USD'
                },
                gender: {
                    type: Sequelize.STRING(2)
                },
                year: {
                    type: Sequelize.INTEGER
                },
                children: {
                    type: Sequelize.INTEGER
                },
                lastLogin: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.fn('now'),
                    allowNull: false
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.fn('now')
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.fn('now')
                }
            },
            {
                tableName: 'app_user',
                sequelize: queryInterface.sequelize // this bit is important
            }
        );

        const MicroCreditApplication = await queryInterface.sequelize.define(
            'microcredit_applications',
            {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER
                },
                userId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: 'app_user',
                        key: 'id'
                    },
                    onDelete: 'CASCADE',
                    allowNull: false
                },
                form: {
                    type: Sequelize.JSONB,
                    allowNull: false
                },
                prismicId: {
                    type: Sequelize.STRING(32),
                    allowNull: false
                },
                amount: {
                    allowNull: true,
                    type: Sequelize.INTEGER
                },
                period: {
                    allowNull: true,
                    type: Sequelize.INTEGER
                },
                status: {
                    allowNull: false,
                    type: Sequelize.INTEGER
                },
                decisionOn: {
                    allowNull: true,
                    type: Sequelize.DATE
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE
                }
            },
            {
                tableName: 'microcredit_applications',
                sequelize: queryInterface.sequelize // this bit is important
            }
        );

        const allCurrentUsersWithoutApplications = await User.findAll({
            limit: 50
        });

        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
        }

        const totalNewApplications = 50;
        const newApplications = [];
        for (let index = 0; index < totalNewApplications; index++) {
            const status = getRandomInt(0, 3);
            newApplications.push({
                userId: allCurrentUsersWithoutApplications[index].id,
                form: { 'form-name': 'microcredit-application' },
                prismicId: 'X' + getRandomInt(1000000000, 9999999999),
                amount: getRandomInt(2, 11),
                // between 3, 6 or 9 months
                period: getRandomInt(1, 4) * 7776000,
                status,
                // it was decided somewhat between now and 4 months ago
                decisionOn: status !== 0 ? new Date(Date.now() - getRandomInt(0, 5) * 2592000 * 1000) : null
            });
        }

        await MicroCreditApplication.bulkCreate(newApplications);
    }
};
