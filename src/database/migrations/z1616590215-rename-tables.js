'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.renameTable('AppSubscribers', 'app_subscribers');
        await queryInterface.renameTable(
            'UbiRequestChangeParams',
            'ubi_request_changeParams'
        );
        await queryInterface.renameTable('AppUserDevice', 'app_user_device');
        await queryInterface.renameTable(
            'AppAnonymousReport',
            'app_anonymous_report'
        );
    },
    down(queryInterface, Sequelize) {},
};
