'use strict';

const BigNumber = require("bignumber.js");
const axios = require('axios');

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {

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
                allowNull: true
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
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            }
        }, {
            tableName: 'beneficiary',
            sequelize: queryInterface.sequelize, // this bit is important
        });

        const GlobalDailyState = await queryInterface.sequelize.define('globaldailystate', {
            date: {
                type: Sequelize.DATEONLY,
                primaryKey: true,
                unique: true,
                allowNull: false,
            },
            meanSSI: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            claimed: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            claims: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            beneficiaries: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            raised: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            backers: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            volume: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            transactions: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            reach: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            totalRaised: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: Sequelize.DECIMAL(30), // max 999,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            totalDistributed: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: Sequelize.DECIMAL(30), // max 999,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            totalBackers: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            totalBeneficiaries: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                allowNull: false,
            },
            givingRate: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            ubiRate: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            fundingRate: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            spendingRate: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            avgComulativeUbi: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: Sequelize.DECIMAL(24), // max 999,999 - plus 18 decimals
                allowNull: false,
            },
            avgUbiDuration: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            totalVolume: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: Sequelize.DECIMAL(32), // max 99,999,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            totalTransactions: {
                type: Sequelize.BIGINT, // max 9,223,372,036,854,775,807
                allowNull: false,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            }
        }, {
            tableName: 'globaldailystate',
            sequelize: queryInterface.sequelize, // this bit is important
        });


        let transactions = 0;
        let volume = new BigNumber('0');

        const beneficiaryAddresses = (await Beneficiary.findAll({ attributes: ['address'], limit: 8 })).map((b) => b.address);
        for (let index = 0; index < beneficiaryAddresses.length; index++) {

            const query = await axios.get(
                `${process.env.BLOCKSCOUT_API_URL}?module=account&action=tokentx&address=${beneficiaryAddresses[index]}`
            );
            // if there's an empty request
            if (query.data.result.length === 0) {
                continue;
            }

            const rawResult = query.data.result.filter((r) => (new BigNumber(r.value.toString()).gt('9999999999999999'))); // >0,009

            for (let index = 0; index < rawResult.length; index++) {
                transactions = transactions + 1;
                volume = volume.plus(rawResult[index].value.toString());
            }
        }

        console.log(volume, transactions);

        const lastEntryDate = new Date(new Date().getTime() - 24 * 60 * 60 * 1000); // updating yesterday, which is the last entry
        lastEntryDate.setHours(0, 0, 0, 0);

        return GlobalDailyState.update({ transactions, volume: volume.toString(), totalTransactions: transactions, totalVolume: volume.toString() }, { where: { date: lastEntryDate } });
    },
    down: (queryInterface) => {
    }
};