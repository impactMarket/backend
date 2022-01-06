'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.removeConstraint('manager', 'manager_communityId_fkey');
        await queryInterface.renameColumn('manager', 'communityId', 'communityPublicId');

        await queryInterface.addColumn('manager', 'communityId', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1
        });
    },

    down(queryInterface, Sequelize) {},
};
