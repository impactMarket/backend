'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        // add new fields
        await queryInterface.addColumn('ubi_community_contract', 'minTranche', {
            type: Sequelize.FLOAT,
            allowNull: true,
        });
        await queryInterface.addColumn('ubi_community_contract', 'maxTranche', {
            type: Sequelize.FLOAT,
            allowNull: true,
        });
        
        // change fields type
        await queryInterface.changeColumn('ubi_community_contract', 'maxClaim', {
            type: Sequelize.FLOAT,
            allowNull: false,
        });
        await queryInterface.changeColumn('ubi_community_contract', 'claimAmount', {
            type: Sequelize.FLOAT,
            allowNull: false,
        });
        await queryInterface.changeColumn('ubi_community_contract', 'decreaseStep', {
            type: Sequelize.FLOAT,
            allowNull: false,
        });

        // convert wei to ether
        const query = `
        UPDATE ubi_community_contract
        SET "maxClaim" = contract."maxClaim", "claimAmount" = contract."claimAmount", "decreaseStep" = contract."decreaseStep"
        FROM (SELECT "maxClaim" / (10^18) as "maxClaim", "claimAmount" / (10^18) as "claimAmount", "decreaseStep" / (10^18) as "decreaseStep", "communityId" as community from ubi_community_contract) contract
        WHERE contract."community" = "communityId"`;

        await queryInterface.sequelize.query(query, {
            raw: true,
            type: Sequelize.QueryTypes.UPDATE,
        });
    },

    down(queryInterface, Sequelize) {},
};
