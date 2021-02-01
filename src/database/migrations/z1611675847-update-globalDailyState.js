'use strict';


module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'globaldailystate',
            'reachOut',
            {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
        );
        return queryInterface.addColumn(
            'globaldailystate',
            'totalReachOut',
            {
                type: Sequelize.BIGINT, // max 9,223,372,036,854,775,807
                defaultValue: 0,
                allowNull: false,
            },
        );

    },

    down(queryInterface, Sequelize) {
    },
};
