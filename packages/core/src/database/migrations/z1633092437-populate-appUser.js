'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        
        const commonColumns = {
            avatarMediaId: {
                type: Sequelize.INTEGER,
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
            active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING(64),
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
            deletedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            }
        };

        const AppUser = await queryInterface.sequelize.define(
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
                ...commonColumns,
            },
            {
                tableName: 'app_user',
                sequelize: queryInterface.sequelize, 
            }
        );

        const User = await queryInterface.sequelize.define(
            'user',
            {
                address: {
                    type: Sequelize.STRING(44),
                    primaryKey: true,
                    allowNull: false,
                },
                ...commonColumns,
            },
            {
                tableName: 'user',
                sequelize: queryInterface.sequelize, 
            }
        );

        const userRegistries = await User.findAll();

        for await(let registry of userRegistries) {
            await AppUser.create({
                address: registry.address,
                avatarMediaId: registry.avatarMediaId,
                username: registry.username,
                language: registry.language,
                currency: registry.currency,
                pushNotificationToken: registry.pushNotificationToken,
                gender: registry.gender,
                year: registry.year,
                children: registry.children,
                lastLogin: registry.lastLogin,
                suspect: registry.suspect,
                active:registry.active,
                email: registry.email,
                createdAt: registry.createdAt,
                updatedAt: registry.updatedAt,
                deletedAt: registry.deletedAt
            });
        }

        await Promise.all([
            queryInterface.removeConstraint('app_user_through_trust', 'app_user_through_trust_userAddress_fkey'),
            queryInterface.removeConstraint('story_content', 'story_content_byAddress_fkey'),
            queryInterface.removeConstraint('story_user_engagement', 'story_user_engagement_address_fkey'),
            queryInterface.removeConstraint('app_notification', 'app_notification_address_fkey'),
        ]);

        await Promise.all([
            queryInterface.addConstraint('app_user_through_trust', {
                fields: ['userAddress'],
                type: 'foreign key',
                name: 'app_user_through_trust_userAddress_fkey',
                references: {
                  table: 'app_user',
                  field: 'address'
                },
                onDelete: 'cascade'
            }),
            queryInterface.addConstraint('story_content', {
                fields: ['byAddress'],
                type: 'foreign key',
                name: 'story_content_byAddress_fkey',
                references: {
                  table: 'app_user',
                  field: 'address'
                },
                onDelete: 'cascade'
            }),
            queryInterface.addConstraint('story_user_engagement', {
                fields: ['address'],
                type: 'foreign key',
                name: 'story_user_engagement_address_fkey',
                references: {
                  table: 'app_user',
                  field: 'address'
                },
                onDelete: 'cascade'
            }),
            queryInterface.addConstraint('app_notification', {
                fields: ['address'],
                type: 'foreign key',
                name: 'app_notification_address_fkey',
                references: {
                  table: 'app_user',
                  field: 'address'
                },
                onDelete: 'cascade'
            }),
        ]);
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('app_user');
    },
};
