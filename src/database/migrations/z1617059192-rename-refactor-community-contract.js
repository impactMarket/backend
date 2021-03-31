'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.renameColumn(
            'communitycontract',
            'communityId',
            'communityPublicId'
        );
        await queryInterface.removeConstraint(
            'communitycontract',
            'communitycontract_communityId_fkey'
        );
        await queryInterface.removeConstraint(
            'communitycontract',
            'communitycontract_pkey'
        );
        await queryInterface.renameTable(
            'communitycontract',
            'ubi_community_contract'
        );
        await queryInterface.addColumn(
            'ubi_community_contract',
            'communityId',
            {
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
            }
        );

        const query = 'select id, "publicId" from community';
        const ids = await queryInterface.sequelize.query(query, {
            raw: true,
            type: Sequelize.QueryTypes.SELECT,
        });
        for (const community in ids) {
            const element = ids[community];
            await queryInterface.sequelize.query(
                `update ubi_community_contract set "communityId"=${parseInt(
                    element.id,
                    10
                )} where "communityPublicId" = '${element.publicId}'`
            );
        }

        await queryInterface.changeColumn(
            'ubi_community_contract',
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
            'alter table ubi_community_contract alter column "communityId" drop default;'
        );

        await queryInterface.removeColumn(
            'ubi_community_contract',
            'communityPublicId'
        );
    },
    down(queryInterface, Sequelize) {},
};
