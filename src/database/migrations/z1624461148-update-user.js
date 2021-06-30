'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        const query =
            'select "user".address from "user" left join app_user_through_trust autt on "user".address = autt."userAddress" left join app_user_trust aut on autt."appUserTrustId" = aut.id where aut.suspect = true';

        const suspectUsers = await queryInterface.sequelize.query(query, {
            raw: true,
            type: Sequelize.QueryTypes.SELECT,
        });
        for (const user in suspectUsers) {
            const element = suspectUsers[user];
            await queryInterface.sequelize.query(
                `update "user" set suspect=true where address=${element.address}`
            );
        }
    },

    down(queryInterface, Sequelize) {},
};
