'use strict';

const AWS = require('aws-sdk');

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        const query = `
            UPDATE app_user
            SET "phone" = "user".phone
            FROM (
                select "userAddress", phone
                from app_user_through_trust inner join app_user_trust aut on aut.id = app_user_through_trust."appUserTrustId"
            ) "user"
            WHERE "app_user"."address" = "user"."userAddress"`;

        await queryInterface.sequelize.query(query, {
            raw: true,
            type: Sequelize.QueryTypes.UPDATE,
        });
    },

    down(queryInterface, Sequelize) {},
};
