'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        const Beneficiary = await queryInterface.sequelize.define(
            'beneficiary',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                address: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                },
                communityId: {
                    type: Sequelize.UUID,
                    references: {
                        model: 'community', // name of Target model
                        key: 'publicId', // key in Target model that we're referencing
                    },
                    onDelete: 'RESTRICT',
                    allowNull: true,
                },
                active: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                    allowNull: false,
                },
                tx: {
                    type: Sequelize.STRING(68),
                    unique: true,
                    allowNull: false,
                },
                txAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                claims: {
                    type: Sequelize.INTEGER,
                    defaultValue: 0,
                    allowNull: false,
                },
                lastClaimAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                penultimateClaimAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
            },
            {
                tableName: 'beneficiary',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        const Manager = await queryInterface.sequelize.define(
            'manager',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                user: {
                    type: Sequelize.STRING(44),
                    references: {
                        model: 'user',
                        key: 'address',
                    },
                    onDelete: 'RESTRICT',
                    allowNull: false,
                },
                communityId: {
                    type: Sequelize.UUID,
                    references: {
                        model: 'community',
                        key: 'publicId',
                    },
                    onDelete: 'RESTRICT',
                    allowNull: false,
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
            },
            {
                tableName: 'manager',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        const CommunityState = await queryInterface.sequelize.define(
            'ubi_community_state',
            {
                id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                },
                communityId: {
                    type: Sequelize.UUID,
                    references: {
                        model: 'community', // name of Target model
                        key: 'publicId', // key in Target model that we're referencing
                    },
                    onDelete: 'RESTRICT',
                    allowNull: false,
                },
                claimed: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                    defaultValue: 0,
                    allowNull: false,
                },
                claims: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    defaultValue: 0,
                    allowNull: false,
                },
                beneficiaries: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    defaultValue: 0,
                    allowNull: false,
                },
                removedBeneficiaries: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    defaultValue: 0,
                    allowNull: false,
                },
                managers: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    defaultValue: 0,
                    allowNull: false,
                },
                raised: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                    defaultValue: 0,
                    allowNull: false,
                },
                backers: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    defaultValue: 0,
                    allowNull: false,
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
                tableName: 'ubi_community_state',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        // update removed beneficiaries

        const inactive = await Beneficiary.findAll({
            attributes: [
                'communityId',
                [
                    queryInterface.sequelize.fn(
                        'count',
                        queryInterface.sequelize.col('address')
                    ),
                    'total',
                ],
            ],
            where: {
                active: false,
            },
            group: ['communityId'],
            raw: true,
        });

        for (let i = 0; i < inactive.length; i += 1) {
            await CommunityState.update(
                {
                    removedBeneficiaries: inactive[i].total,
                },
                { where: { communityId: inactive[i].communityId } }
            );
        }

        // update managers

        const managers = await Manager.findAll({
            attributes: [
                'communityId',
                [
                    queryInterface.sequelize.fn(
                        'count',
                        queryInterface.sequelize.col('user')
                    ),
                    'total',
                ],
            ],
            group: ['communityId'],
            raw: true,
        });

        for (let i = 0; i < managers.length; i += 1) {
            await CommunityState.update(
                {
                    managers: managers[i].total,
                },
                { where: { communityId: managers[i].communityId } }
            );
        }
    },

    down(queryInterface, Sequelize) {},
};
