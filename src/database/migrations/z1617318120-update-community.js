'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        return queryInterface.addColumn('community', 'logo', {
            type: Sequelize.INTEGER,
            references: {
                model: 'app_media_content',
                key: 'id',
            },
            // onDelete: 'SET NULL', // default
            allowNull: true,
        });
    },

    down(queryInterface, Sequelize) {},
};
