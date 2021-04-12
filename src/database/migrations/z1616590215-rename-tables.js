'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.renameTable('AppSubscribers', 'app_subscribers');
        await queryInterface.renameTable(
            'UbiRequestChangeParams',
            'ubi_request_change_params'
        );
        await queryInterface.renameTable('AppUserDevice', 'app_user_device');
        await queryInterface.renameTable(
            'AppAnonymousReport',
            'app_anonymous_report'
        );
    },
    down(queryInterface, Sequelize) {},
};
