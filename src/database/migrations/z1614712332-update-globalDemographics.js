'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('globaldemographics', 'undisclosed', {
            type: Sequelize.INTEGER, // max 2,147,483,647
            defaultValue: 0,
            allowNull: false,
        });
        return queryInterface.addColumn('globaldemographics', 'totalGender', {
            type: Sequelize.INTEGER, // max 2,147,483,647
            defaultValue: 0,
            allowNull: false,
        });
    },
    down: (queryInterface) => {
        //
    },
};
