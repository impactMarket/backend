'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('globaldemographics', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            country: {
                type: Sequelize.STRING(4), // ISO code
                allowNull: false,
            },
            male: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            female: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange1: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange2: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange3: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange4: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange5: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange6: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('globaldemographics');
    }
};