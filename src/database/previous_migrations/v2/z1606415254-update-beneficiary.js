'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('beneficiary', 'active', {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        });
        //
        const Community = await queryInterface.sequelize.define(
            'community',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                publicId: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    unique: true,
                    allowNull: false,
                },
                requestByAddress: {
                    type: Sequelize.STRING(44),
                    unique: true,
                    allowNull: false,
                },
                contractAddress: {
                    type: Sequelize.STRING(44),
                },
                name: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                description: {
                    type: Sequelize.STRING(1024),
                    allowNull: false,
                },
                descriptionEn: {
                    type: Sequelize.STRING(1024),
                    allowNull: true,
                },
                language: {
                    type: Sequelize.STRING(8),
                    defaultValue: 'en',
                    allowNull: false,
                },
                currency: {
                    type: Sequelize.STRING(4),
                    defaultValue: 'USD',
                    allowNull: false,
                },
                city: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                country: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                gps: {
                    type: Sequelize.JSON,
                    allowNull: false,
                },
                email: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                visibility: {
                    type: Sequelize.ENUM('public', 'private'),
                    allowNull: false,
                },
                coverImage: {
                    type: Sequelize.STRING(128),
                    allowNull: false,
                },
                status: {
                    type: Sequelize.ENUM('pending', 'valid', 'removed'),
                    allowNull: false,
                },
                started: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            },
            {
                tableName: 'community',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );
        const beneficiariesToInsert = [];
        const records = (
            await queryInterface.sequelize.query(
                `SELECT values->>'_account' account, "contractAddress", "txAt"
        FROM transactions t1
        WHERE t1."txAt" = (SELECT MAX(t2."txAt")
                         FROM transactions t2
                         WHERE t2.values->>'_account' = t1.values->>'_account'
                           and (event='BeneficiaryAdded' or event='BeneficiaryRemoved')) and event='BeneficiaryRemoved'`,
                { raw: true }
            )
        )[0];

        for (let index = 0; index < records.length; index++) {
            const community = await Community.findOne({
                where: { contractAddress: records[index].contractAddress },
            });
            if (community !== null) {
                beneficiariesToInsert.push({
                    address: records[index].account,
                    communityId: community.publicId,
                    active: false,
                    txAt: records[index].txAt,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }
        return queryInterface.bulkInsert('beneficiary', beneficiariesToInsert);
    },

    down(queryInterface, Sequelize) {},
};
