'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const ExchangeRegistry = await queryInterface.sequelize.define(
            'exchange_registry',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                name: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                description: {
                    type: Sequelize.STRING(256),
                    allowNull: false,
                },
                logoUrl: {
                    type: Sequelize.STRING(256),
                    allowNull: true,
                },
                countries: {
                    type: Sequelize.ARRAY(Sequelize.STRING(2)),
                    allowNull: true,
                },
                global: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                customImplementation: {
                    type: Sequelize.STRING(16),
                    allowNull: true,
                },
                iframeUrl: {
                    type: Sequelize.STRING(256),
                    allowNull: true,
                },
                fee: {
                    type: Sequelize.FLOAT,
                    allowNull: true,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            },
            {
                tableName: 'exchange_registry',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        /**
         * Add seed commands here.
         *
         * Example:
         * await queryInterface.bulkInsert('People', [{
         *   name: 'John Doe',
         *   isBetaMember: false
         * }], {});
         */

		await ExchangeRegistry.bulkCreate([
			{
				name: 'Binance',
				description: 'Binance is a cryptocurrency exchange that provides a platform for trading various cryptocurrencies.',
				logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Binance_Logo.svg/1200px-Binance_Logo.svg.png',
				countries: ['US', 'CN', 'JP'],
				global: false,
				customImplementation: null,
				iframeUrl: null,
				fee: 0.1,
			},
			{
				name: 'Coinbase',
				description: 'Coinbase is a digital currency exchange headquartered in San Francisco, California, United States.',
				logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Logo_2019.svg/1200px-Logo_2019.svg.png',
				countries: ['KR', 'RU', 'IN', 'BR', 'AU'],
				global: false,
				customImplementation: null,
				iframeUrl: null,
				fee: 0.1,
			},
			{
				name: 'Kraken',
				description: 'Kraken is a US-based cryptocurrency exchange, founded in 2011.',
				logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Kraken_logo.svg/1200px-Kraken_logo.svg.png',
				countries: ['CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE'],
				global: false,
				customImplementation: null,
				iframeUrl: null,
				fee: 0.1,
			}
		]);
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         * await queryInterface.bulkDelete('People', null, {});
         */
    },
};
