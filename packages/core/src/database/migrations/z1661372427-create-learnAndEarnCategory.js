'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('learn_and_earn_category', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            prismicId: {
                type: Sequelize.STRING(32),
                allowNull: false,
            },
            languages: {
                type: Sequelize.ARRAY(Sequelize.STRING(4)),
                allowNull: true,
            },
            active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            },
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('learn_and_earn_category');
    },
};
