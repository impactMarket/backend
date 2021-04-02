'use strict';

const BigNumber = require('bignumber.js');
const axios = require('axios');
const { ethers } = require('ethers');

BigNumber.config({ EXPONENTIAL_AT: [-7, 30] });

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const Beneficiary = await queryInterface.sequelize.define(
            'beneficiary',
            {
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
                    allowNull: true,
                },
                active: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                    allowNull: false,
                },
                tx: {
                    type: Sequelize.STRING(68),
                    unique: true,
                    allowNull: false,
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
                },
            },
            {
                tableName: 'beneficiary',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

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

        const BeneficiaryTransaction = await queryInterface.sequelize.define(
            'beneficiarytransaction',
            {
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
                tableName: 'beneficiarytransaction',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        // get all community addresses
        const communitiesAddresses = (
            await Community.findAll({
                attributes: ['contractAddress'],
                where: {
                    status: 'valid',
                    visibility: 'public',
                },
            })
        ).map((c) => c.contractAddress);
        const communitiesIds = (
            await Community.findAll({
                attributes: ['publicId'],
                where: {
                    status: 'valid',
                    visibility: 'public',
                },
            })
        ).map((c) => c.publicId);

        const beneficiaryAddresses = (
            await Beneficiary.findAll({
                attributes: ['address'],
                where: {
                    communityId: { [Sequelize.Op.in]: communitiesIds },
                    txAt: { [Sequelize.Op.lt]: new Date(1608555600000) },
                },
            })
        ).map((b) => b.address);

        const addBeneficiaryTx = async (
            fromBeneficiary,
            beneficiary,
            address,
            value,
            timestamp,
            tx
        ) => {
            try {
                await BeneficiaryTransaction.create({
                    beneficiary,
                    withAddress: address,
                    amount: value,
                    isFromBeneficiary: fromBeneficiary,
                    tx,
                    date: new Date(timestamp),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            } catch (e) {
                console.log('error in BeneficiaryTransaction ' + e);
            }
        };

        for (let b = 0; b < beneficiaryAddresses.length; b++) {
            // for (let b = 55; b < 65; b++) {
            console.log(b);
            const query = await axios.get(
                `${process.env.BLOCKSCOUT_API_URL}?module=account&action=tokentx&address=${beneficiaryAddresses[b]}`
            );
            // if there's an empty request
            if (query.data.result.length === 0) {
                continue;
            }

            const rawResult = query.data.result.filter(
                (r) => r.value.toString().length > 15
            ); // >0,0009 (999999999999999)

            for (let r = 0; r < rawResult.length; r++) {
                // 0xdC553892cdeeeD9f575aa0FBA099e5847fd88D20 atestation proxy
                if (
                    rawResult[r].to.toLowerCase() ===
                    '0xdC553892cdeeeD9f575aa0FBA099e5847fd88D20'.toLowerCase()
                ) {
                    continue;
                }
                // not to himself
                if (rawResult[r].to === rawResult[r].from) {
                    continue;
                }
                // if not "from" nor "to" a community
                if (
                    !communitiesAddresses.includes(
                        ethers.utils.getAddress(rawResult[r].from)
                    ) &&
                    !communitiesAddresses.includes(
                        ethers.utils.getAddress(rawResult[r].to)
                    )
                ) {
                    // if from beneficiary
                    if (
                        beneficiaryAddresses[b] ===
                        ethers.utils.getAddress(rawResult[r].from)
                    ) {
                        await addBeneficiaryTx(
                            true,
                            ethers.utils.getAddress(rawResult[r].from),
                            ethers.utils.getAddress(rawResult[r].to),
                            rawResult[r].value.toString(),
                            parseInt(rawResult[r].timeStamp) * 1000,
                            rawResult[r].hash
                        );
                        // if to beneficiary
                    } else if (
                        beneficiaryAddresses[b] ===
                        ethers.utils.getAddress(rawResult[r].to)
                    ) {
                        await addBeneficiaryTx(
                            false,
                            ethers.utils.getAddress(rawResult[r].to),
                            ethers.utils.getAddress(rawResult[r].from),
                            rawResult[r].value.toString(),
                            parseInt(rawResult[r].timeStamp) * 1000,
                            rawResult[r].hash
                        );
                    }
                }
            }
        }
    },
    down: (queryInterface) => {},
};
