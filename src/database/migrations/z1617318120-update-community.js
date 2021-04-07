'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
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
