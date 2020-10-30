'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.renameColumn('claimlocation', 'communityPublicId', 'communityId');
    },
    down: (queryInterface, Sequelize) => {
    }
};