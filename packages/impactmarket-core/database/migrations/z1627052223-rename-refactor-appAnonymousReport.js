'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        // await queryInterface.renameColumn(
        //     'app_anonymous_report',
        //     'status',
        //     'review'
        // );
        // await queryInterface.changeColumn('app_anonymous_report', 'createdAt', {
        //     type: Sequelize.DATE,
        //     allowNull: false,
        // });

        // await queryInterface.renameColumn(
        //     'app_anonymous_report',
        //     'communityId',
        //     'communityPublicId'
        // );
        await queryInterface.removeConstraint(
            'app_anonymous_report',
            'AppAnonymousReport_communityId_fkey'
        );
        await queryInterface.addColumn('app_anonymous_report', 'communityId', {
            type: Sequelize.INTEGER,
            // can't do this yet because it will be zero for all of them
            // primaryKey: true,
            // unique: true,
            // references: {
            //     model: 'community',
            //     key: 'id',
            // },
            // onDelete: 'CASCADE',
            // We need to set a default, because we don't allow null, and there's already rows
            defaultValue: 0,
            allowNull: false,
        });

        const query = 'select id, "publicId" from community';
        const ids = await queryInterface.sequelize.query(query, {
            raw: true,
            type: Sequelize.QueryTypes.SELECT,
        });
        for (const community in ids) {
            const element = ids[community];
            await queryInterface.sequelize.query(
                `update app_anonymous_report set "communityId"=${parseInt(
                    element.id,
                    10
                )} where "communityPublicId" = '${element.publicId}'`
            );
        }

        await queryInterface.changeColumn(
            'app_anonymous_report',
            'communityId',
            {
                type: Sequelize.INTEGER,
                primaryKey: true,
                unique: true,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            }
        );

        await queryInterface.sequelize.query(
            'alter table app_anonymous_report alter column "communityId" drop default;'
        );

        await queryInterface.removeColumn(
            'app_anonymous_report',
            'communityPublicId'
        );
    },
    down(queryInterface, Sequelize) {},
};
