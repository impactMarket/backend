'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        if (process.env.API_ENVIRONMENT === 'production') {
            return;
        }
        
        const merchants = [
            {
                "id": 5,
                "name": "Estilo Raça",
                "description": "merchant description 1",
                "type": 0,
                "fee": 0.005,
                "min": 50,
                "address": "Rua Teste, 123 - Cidade - Estado - Brasil",
                "phone": "+5514999999999",
                "country": "BR",
                "gps": {"latitude": -22.87980530856002, "longitude":-42.01779755552476},
                "cashout": false,
                "payment": true,
                "createdAt": "2023-03-03 09:55:52.261000 +00:00",
                "updatedAt": "2023-03-03 09:55:52.261000 +00:00"
            },
            {
                "id": 4,
                "name": "Hortifuti",
                "description": "merchant description 2",
                "type": 1,
                "fee": 0.01,
                "min": 20,
                "address": "Rua Teste, 321 - Cidade - Estado - Brasil",
                "phone": "+5514999999999",
                "country": "BR",
                "gps": {"latitude": -22.88749768186593, "longitude": -42.02991884930137},
                "cashout": true,
                "payment": true,
                "createdAt": "2023-03-03 09:55:52.261000 +00:00",
                "updatedAt": "2023-03-03 09:55:52.261000 +00:00"
            }
        ]

        const Merchants = await queryInterface.sequelize.define(
            'merchant_registry',
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
                country: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                description: {
                    type: Sequelize.STRING(1024),
                    allowNull: false,
                },
                type: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                fee: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                min: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                address: {
                    type: Sequelize.STRING(256),
                    allowNull: false,
                },
                phone: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                gps: {
                    type: Sequelize.JSON,
                    allowNull: false,
                },
                cashout: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                payment: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
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
                tableName: 'merchant_registry',
                sequelize: queryInterface.sequelize,
            }
        );
        await Merchants.bulkCreate(merchants);
    },
};
