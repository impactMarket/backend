'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        const query = `
            UPDATE beneficiary
            SET "communityId" = "community".id
            FROM (SELECT id, "publicId" FROM community) "community"
            WHERE "beneficiary"."communityPublicId" = "community"."publicId"`;

        await queryInterface.sequelize.query(query, {
            raw: true,
            type: Sequelize.QueryTypes.UPDATE,
        });

        await queryInterface.removeColumn('beneficiary', 'communityPublicId');
    },

    down(queryInterface, Sequelize) {},
};
