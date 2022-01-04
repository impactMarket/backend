'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('ubi_beneficiary_survey', 'surveyId', {
            type: Sequelize.INTEGER,
            allowNull: false,
        });
    },

    down(queryInterface, Sequelize) {},
};
