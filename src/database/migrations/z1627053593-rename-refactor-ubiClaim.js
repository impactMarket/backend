'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.sequelize.query(
            'DROP TRIGGER update_claim_states ON claim;'
        );
        await queryInterface.renameColumn(
            'claim',
            'communityId',
            'communityPublicId'
        );
        await queryInterface.removeConstraint(
            'claim',
            'claim_communityId_fkey'
        );
        await queryInterface.renameTable('claim', 'ubi_claim');
        await queryInterface.addColumn('ubi_claim', 'communityId', {
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
                `update ubi_claim set "communityId"=${parseInt(
                    element.id,
                    10
                )} where "communityPublicId" = '${element.publicId}'`
            );
        }

        await queryInterface.changeColumn('ubi_claim', 'communityId', {
            type: Sequelize.INTEGER,
            primaryKey: true,
            unique: true,
            references: {
                model: 'community',
                key: 'id',
            },
            onDelete: 'CASCADE',
            allowNull: false,
        });

        await queryInterface.sequelize.query(
            'alter table ubi_claim alter column "communityId" drop default;'
        );

        await queryInterface.removeColumn('ubi_claim', 'communityPublicId');
        await queryInterface.removeColumn('ubi_claim', 'createdAt');
        await queryInterface.removeColumn('ubi_claim', 'updatedAt');
    },
    down(queryInterface, Sequelize) {},
};
