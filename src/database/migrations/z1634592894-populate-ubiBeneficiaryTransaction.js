'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        const commonColumns = {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            beneficiary: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
            withAddress: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
            amount: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: Sequelize.DECIMAL(26), // max 99,999,999 - plus 18 decimals
                allowNull: false,
            },
            isFromBeneficiary: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            },
            tx: {
                type: Sequelize.STRING(68),
                unique: true,
                allowNull: false,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
        }

        const UbiBeneficiaryTransaction = await queryInterface.sequelize.define(
            'ubi_beneficiary_transaction',
            {
                ...commonColumns,
                txAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
            },
            {
                tableName: 'ubi_beneficiary_transaction',
                sequelize: queryInterface.sequelize, 
                timestamps: false,
            }
        );

        const BeneficiaryTransaction = await queryInterface.sequelize.define(
            'beneficiarytransaction',
            {
                ...commonColumns,
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                }
            },
            {
                tableName: 'beneficiarytransaction',
                sequelize: queryInterface.sequelize, 
            }
        );

        const beneficiaryTransaction = await BeneficiaryTransaction.findAll();

        for await(let registry of beneficiaryTransaction) {
            await UbiBeneficiaryTransaction.create({
                id: registry.id,
                beneficiary: registry.beneficiary,
                withAddress: registry.withAddress,
                amount: registry.amount,
                isFromBeneficiary: registry.isFromBeneficiary,
                tx: registry.tx,
                date: registry.date,
                txAt: registry.createdAt,
            });
        }
    },
    down: (queryInterface, Sequelize) => {},
};
