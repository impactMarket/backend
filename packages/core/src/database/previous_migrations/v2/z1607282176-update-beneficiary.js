'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'beneficiary',
            'tx',
            {
                type: Sequelize.STRING(68),
                unique: true,
                allowNull: true,
            },
        );

        const Beneficiary = await queryInterface.sequelize.define('beneficiary', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            address: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
            communityId: {
                type: Sequelize.UUID,
                references: {
                    model: 'community', // name of Target model
                    key: 'publicId', // key in Target model that we're referencing
                },
                onDelete: 'RESTRICT',
                allowNull: false
            },
            active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            tx: {
                type: Sequelize.STRING(68),
                unique: true,
                allowNull: true,
            },
            txAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            claims: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            lastClaimAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            penultimateClaimAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }, {
            tableName: 'beneficiary',
            sequelize: queryInterface.sequelize, // this bit is important
        });

        const records = (await queryInterface.sequelize.query(`select t.tx, b.address from beneficiary b, transactions t
        where t.event = 'BeneficiaryAdded'
        and b.address = t.values->>'_account'`, { raw: true }))[0];

        
        for (let index = 0; index < records.length; index++) {
            await Beneficiary.update({ tx: records[index].tx }, { where: { address: records[index].address } });
        }

        return queryInterface.changeColumn(
            'beneficiary',
            'tx',
            {
                type: Sequelize.STRING(68),
                unique: true,
                allowNull: false,
            },
        );
    },

    down(queryInterface, Sequelize) {
    }
}  