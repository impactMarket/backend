'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.sequelize.query(
            'update "user" set gender=\'u\' where gender is null'
        );
        return queryInterface.changeColumn('user', 'gender', {
            type: Sequelize.STRING(2),
            defaultValue: 'u',
        });
    },
    down: (queryInterface) => {
        //
    },
};
