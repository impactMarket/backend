'use strict';

const BigNumber = require("bignumber.js");
const axios = require('axios');
const { ethers } = require("ethers");

BigNumber.config({ EXPONENTIAL_AT: [-7, 30] });

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
            avgMedianSSI: {
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
            totalReach: {
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
        const Community = await queryInterface.sequelize.define('community', {
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
                allowNull: false
            },
            description: {
                type: Sequelize.STRING(1024),
                allowNull: false
            },
            descriptionEn: {
                type: Sequelize.STRING(1024),
                allowNull: true
            },
            language: {
                type: Sequelize.STRING(8),
                defaultValue: 'en',
                allowNull: false
            },
            currency: {
                type: Sequelize.STRING(4),
                defaultValue: 'USD',
                allowNull: false
            },
            city: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            country: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            gps: {
                type: Sequelize.JSON,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            visibility: {
                type: Sequelize.ENUM('public', 'private'),
                allowNull: false
            },
            coverImage: {
                type: Sequelize.STRING(128),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('pending', 'valid', 'removed'),
                allowNull: false
            },
            txCreationObj: {
                type: Sequelize.JSON
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            }
        }, {
            tableName: 'community',
            sequelize: queryInterface.sequelize, // this bit is important
        });
        const ReachedAddress = await queryInterface.sequelize.define('reachedaddress', {
            address: {
                type: Sequelize.STRING(44),
                allowNull: false,
                unique: true,
                primaryKey: true,
            },
            lastInteraction: {
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
            }
        }, {
            tableName: 'reachedaddress',
            sequelize: queryInterface.sequelize, // this bit is important
        });
        const BeneficiaryTransaction = await queryInterface.sequelize.define('beneficiarytransaction', {
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
            }
        }, {
            tableName: 'beneficiarytransaction',
            sequelize: queryInterface.sequelize, // this bit is important
        });

        const onlyDate = (timestamp) => {
            const dateObj = new Date(timestamp);
            dateObj.setHours(0, 0, 0, 0);
            return dateObj.getTime();
        };

        const volumeTxReachByDay = new Map();
        const accVolumeTxReachByDay = new Map();
        const reachedAddresses = new Map();
        const allDates = [];

        // get all community addresses
        const communitiesAddresses = (await Community.findAll({
            attributes: ['contractAddress'],
            where: {
                status: 'valid',
                visibility: 'public'
            },
        })).map((c) => c.contractAddress);
        const communitiesIds = (await Community.findAll({
            attributes: ['publicId'],
            where: {
                status: 'valid',
                visibility: 'public'
            },
        })).map((c) => c.publicId);

        const beneficiaryAddresses = (await Beneficiary.findAll({
            attributes: ['address'],
            where: { communityId: { [Sequelize.Op.in]: communitiesIds } },
        })).map((b) => b.address);

        const updateMaps = (fromBeneficiary, beneficiary, address, value, timestamp, tx) => {
            let previousValues = volumeTxReachByDay.get(onlyDate(timestamp));
            let newValues;
            if (previousValues === undefined) {
                newValues = {
                    transactions: 1,
                    volume: value,
                    reach: reachedAddresses.get(ethers.utils.getAddress(address)) !== undefined ? 0 : 1
                }
            } else {
                newValues = {
                    transactions: previousValues.transactions + 1,
                    volume: new BigNumber(previousValues.volume).plus(value).toString(),
                    reach: reachedAddresses.get(ethers.utils.getAddress(address)) !== undefined ? previousValues.reach : previousValues.reach + 1
                }
            }
            // add to BeneficiaryTransaction
            BeneficiaryTransaction.create({
                beneficiary,
                withAddress: address,
                amount: value,
                isFromBeneficiary: fromBeneficiary,
                tx,
                date: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            }).catch((e) => console.log('error in BeneficiaryTransaction ' + e));
            reachedAddresses.set(ethers.utils.getAddress(address), new Date(timestamp));
            volumeTxReachByDay.set(onlyDate(timestamp), newValues);
            allDates.push(onlyDate(timestamp));
        }

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

            const rawResult = query.data.result.filter((r) => (new BigNumber(r.value.toString()).gt('9999999999999999'))); // >0,009

            for (let r = 0; r < rawResult.length; r++) {
                // if not "from" nor "to" a community
                // 0xdC553892cdeeeD9f575aa0FBA099e5847fd88D20 atestation proxy
                if (rawResult[r].to === '0xdC553892cdeeeD9f575aa0FBA099e5847fd88D20'.toLowerCase()) {
                    continue;
                }
                if (rawResult[r].to === rawResult[r].from) {
                    continue;
                }
                if (!communitiesAddresses.includes(ethers.utils.getAddress(rawResult[r].from)) && !communitiesAddresses.includes(ethers.utils.getAddress(rawResult[r].to))) {
                    if (beneficiaryAddresses[b] === ethers.utils.getAddress(rawResult[r].from)) {
                        updateMaps(true, ethers.utils.getAddress(rawResult[r].from), rawResult[r].to, rawResult[r].value.toString(), parseInt(rawResult[r].timeStamp) * 1000, rawResult[r].hash);
                    } else if (beneficiaryAddresses[b] === ethers.utils.getAddress(rawResult[r].to)) {
                        updateMaps(false, ethers.utils.getAddress(rawResult[r].to), rawResult[r].from, rawResult[r].value.toString(), parseInt(rawResult[r].timeStamp) * 1000, rawResult[r].hash);
                    }
                }
            }
        }

        const uniqueOrderedDates = Array.from(new Set(allDates.sort()));
        console.log(allDates.sort(), new Set(allDates.sort()), uniqueOrderedDates)

        accVolumeTxReachByDay.set(uniqueOrderedDates[0], volumeTxReachByDay.get(uniqueOrderedDates[0]));
        for (let x = 1; x < uniqueOrderedDates.length; x += 1) {
            const today = volumeTxReachByDay.get(uniqueOrderedDates[x]);
            const previous = accVolumeTxReachByDay.get(uniqueOrderedDates[x - 1]);
            accVolumeTxReachByDay.set(uniqueOrderedDates[x], {
                transactions: today.transactions + previous.transactions,
                volume: new BigNumber(today.volume).plus(previous.volume).toString(),
                reach: today.reach + previous.reach,
            });
        }

        console.log(volumeTxReachByDay, reachedAddresses, uniqueOrderedDates, accVolumeTxReachByDay);

        // const reachedAddressesToInsert = [];

        for (var [key, value] of reachedAddresses) {
            try {
                await ReachedAddress.create({
                    address: key,
                    lastInteraction: value,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            } catch(e) {
                console.log('error in ReachedAddress' + e)
            }
        }

        // await queryInterface.bulkInsert('reachedaddress', reachedAddressesToInsert);

        for (let x = 0; x < uniqueOrderedDates.length; x += 1) {
            const today = volumeTxReachByDay.get(uniqueOrderedDates[x]);
            const accToday = accVolumeTxReachByDay.get(uniqueOrderedDates[x]);
            await GlobalDailyState.update({
                volume: today.volume,
                transactions: today.transactions,
                reach: today.reach,
                totalVolume: accToday.volume,
                totalTransactions: BigInt(accToday.transactions),
                totalReach: BigInt(accToday.reach),
            }, { where: { date: new Date(uniqueOrderedDates[x]) } });
        }
    },
    down: (queryInterface) => {
    }
};