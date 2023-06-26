'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.removeConstraint('ssi', 'ssi_communityPublicId_fkey');
        await queryInterface.removeConstraint('notifiedbacker', 'notifiedbacker_communityId_fkey');
        await queryInterface.removeConstraint('ubi_request_change_params', 'ubi_request_change_params_communityId_fkey');
        
        await queryInterface.removeColumn('community', 'publicId');
        await queryInterface.removeColumn('community', 'descriptionEn');
        await queryInterface.removeColumn('community', 'coverImage');
        await queryInterface.removeColumn('community', 'coverMediaId');
    },

    down(queryInterface, Sequelize) {},
};
