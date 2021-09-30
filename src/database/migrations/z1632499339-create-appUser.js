'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('app_user', {
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
            },
        });

        // get the user table columns
        const insertQuery = (await queryInterface.sequelize.query(`
            SELECT format(
                'INSERT INTO app_user ("%1$s")
                    SELECT "%1$s"
                    FROM "user"
                ',
                (select string_agg( column_name, '","' ) from information_schema.columns
                where table_schema = 'public' and table_name = 'user')
            )`, 
            {
                type: Sequelize.QueryTypes.SELECT
            }
        ))[0];

        // populate app_user table
        await queryInterface.sequelize.query(insertQuery.format);

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
        ])

    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('app_user');
    },
};
