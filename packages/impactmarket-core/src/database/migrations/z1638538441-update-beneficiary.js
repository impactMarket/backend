'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.removeConstraint('beneficiary', 'beneficiary_communityId_fkey');
        await queryInterface.renameColumn('beneficiary', 'communityId', 'communityPublicId');

        await queryInterface.addColumn('beneficiary', 'communityId', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1
        });
    },

    down(queryInterface, Sequelize) {},
};
