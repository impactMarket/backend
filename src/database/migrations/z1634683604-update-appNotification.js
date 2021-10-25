'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('app_notification', 'userId', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1
        });

        const query = `
            UPDATE app_notification
            SET "userId" = "user".id
            FROM (SELECT id, address FROM app_user) "user"
            WHERE "user".address = app_notification.address`;

        await queryInterface.sequelize.query(query, {
            raw: true,
            type: Sequelize.QueryTypes.UPDATE,
        });

        await queryInterface.removeConstraint(
            'app_notification',
            'app_notification_address_fkey'
        );
      
        await queryInterface.removeColumn(
            'app_notification',
            'address'
        );

        await queryInterface.addConstraint('app_notification', {
            fields: ['userId'],
            type: 'foreign key',
            name: 'app_notification_userId_fkey',
            references: {
              table: 'app_user',
              field: 'id'
            },
            onDelete: 'cascade'
        });
    },

    down(queryInterface, Sequelize) {},
};
