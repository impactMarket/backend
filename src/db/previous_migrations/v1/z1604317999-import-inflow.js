'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const Transactions = await queryInterface.sequelize.define('transactions', {
            uid: {
                type: Sequelize.STRING(64),
                primaryKey: true,
                unique: true,
            },
            tx: {
                type: Sequelize.STRING(68),
                allowNull: false,
            },
            txAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            from: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
            contractAddress: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
            event: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            values: {
                type: Sequelize.JSONB,
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
        }, {
            tableName: 'transactions',
            sequelize: queryInterface.sequelize, // this bit is important
        });
        const Community = await queryInterface.sequelize.define('community', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            publicId: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                unique: true,
                allowNull: false,
            },
            requestByAddress: {
                type: Sequelize.STRING(44),
                unique: true,
                allowNull: false,
            },
            contractAddress: {
                type: Sequelize.STRING(44),
            },
            name: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            description: {
                type: Sequelize.STRING(1024),
                allowNull: false
            },
            descriptionEn: {
                type: Sequelize.STRING(1024),
                allowNull: true
            },
            language: {
                type: Sequelize.STRING(8),
                defaultValue: 'en',
                allowNull: false
            },
            currency: {
                type: Sequelize.STRING(4),
                defaultValue: 'USD',
                allowNull: false
            },
            city: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            country: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            gps: {
                type: Sequelize.JSON,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            visibility: {
                type: Sequelize.ENUM('public', 'private'),
                allowNull: false
            },
            coverImage: {
                type: Sequelize.STRING(128),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('pending', 'valid', 'removed'),
                allowNull: false
            },
            txCreationObj: {
                type: Sequelize.JSON
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            }
        }, {
            tableName: 'community',
            sequelize: queryInterface.sequelize, // this bit is important
        });
        const communities = new Map((await Community.findAll()).map((c) => [c.contractAddress, c.publicId]));
        const inflows = await Transactions.findAll({
            where: {
                event: 'Transfer',
            }
        });
        const inflowsToInsert = inflows.map((inflow) => (
            {
                from: inflow.values.from,
                communityId: communities.get(inflow.values.to),
                amount: inflow.values.value,
                tx: inflow.tx,
                txAt: inflow.txAt,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ));

        return queryInterface.bulkInsert('inflow', inflowsToInsert);
    },
    down: (queryInterface) => {
    }
};