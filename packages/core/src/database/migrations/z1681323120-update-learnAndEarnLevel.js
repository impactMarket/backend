'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        // add new columns
        await queryInterface.addColumn('learn_and_earn_level', 'title', {
            type: Sequelize.STRING(255),
            allowNull: true,
        });

        await queryInterface.addColumn('learn_and_earn_level', 'adminUserId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'app_user',
                key: 'id',
            },
            onDelete: 'CASCADE',
            allowNull: true,
        });

        await queryInterface.addColumn('learn_and_earn_level', 'status', {
            type: Sequelize.ENUM(
                'pending',
                'aproved',
                'declined',
                'published'
            ),
            allowNull: false,
            defaultValue: 'pending',
        });

        // set old columns as optional
        await queryInterface.changeColumn('learn_and_earn_level', 'prismicId', {
            type: Sequelize.STRING(32),
            allowNull: true,
        });
        await queryInterface.changeColumn('learn_and_earn_level', 'categoryId', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.changeColumn('learn_and_earn_level', 'active', {
            type: Sequelize.BOOLEAN,
            allowNull: true,
        });
    },
    down: (queryInterface) => {},
};
