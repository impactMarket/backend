'use strict';

const BigNumber = require('bignumber.js');
const axios = require('axios');
const { ethers } = require('ethers');
const { SHA3 } = require('sha3');

const CommunityContractABI = require('../../contracts/CommunityABI.json');

BigNumber.config({ EXPONENTIAL_AT: [-7, 30] });

async function getBlockTime(blockHash) {
    try {
        const requestContent = {
            id: 0,
            jsonrpc: '2.0',
            method: 'eth_getBlockByHash',
            params: [blockHash, false],
        };
        // handle success
        const requestHeaders = {
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        };
        const response = await axios.post(
            process.env.CHAIN_JSON_RPC_URL,
            requestContent,
            requestHeaders
        );
        return new Date(parseInt(response.data.result.timestamp, 16) * 1000);
    } catch (e) {
        console.log('getBlockTime ' + e);
        return new Date();
    }
}

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
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

        const Claim = await queryInterface.sequelize.define(
            'claim',
            {
                id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
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
                    allowNull: false,
                },
                amount: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(24), // max 999,999 - plus 18 decimals
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
                tableName: 'claim',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        const Transactions = await queryInterface.sequelize.define(
            'transactions',
            {
                uid: {
                    type: Sequelize.STRING(64),
                    primaryKey: true,
                    unique: true,
                },
                tx: {
                    type: Sequelize.STRING(68),
                    allowNull: false,
                },
                txAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                from: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                },
                contractAddress: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                },
                event: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                values: {
                    type: Sequelize.JSONB,
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
                tableName: 'transactions',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        // from 5185945
        // to 5185962

        const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);
        // const allBeneficiaryAddressses = await BeneficiaryService.getAllAddresses();
        const availableCommunities = await Community.findAll({
            where: {
                status: 'valid',
                visibility: {
                    [Sequelize.Op.or]: ['public', 'private'],
                },
            },
        });

        const provider = new ethers.providers.JsonRpcProvider(
            process.env.CHAIN_JSON_RPC_URL
        );
        // get past community events
        for (let c = 0; c < availableCommunities.length; c++) {
            const logsCommunity = await provider.getLogs({
                address: availableCommunities[c].contractAddress,
                fromBlock: 5904565,
                toBlock: 5904750,
                topics: [
                    [
                        // ethers.utils.id('ManagerAdded(address)'),
                        // ethers.utils.id('ManagerRemoved(address)'),
                        // ethers.utils.id('BeneficiaryAdded(address)'),
                        // ethers.utils.id('BeneficiaryLocked(address)'),
                        // ethers.utils.id('BeneficiaryRemoved(address)'),
                        ethers.utils.id('BeneficiaryClaim(address,uint256)'),
                        // ethers.utils.id('CommunityEdited(uint256,uint256,uint256,uint256)'),
                    ],
                ],
            });

            const orderedLogs = logsCommunity.sort((a, b) => {
                if (a.blockNumber > b.blockNumber) {
                    return 1;
                }
                if (a.blockNumber < b.blockNumber) {
                    return -1;
                }
                // a must be equal to b
                return 0;
            });
            const eventsCommunity = orderedLogs.map((log) =>
                ifaceCommunity.parseLog(log)
            );

            // save community events
            for (let ec = 0; ec < eventsCommunity.length; ec += 1) {
                const log = logsCommunity[ec];
                const parsedLog = eventsCommunity[ec];
                let txAt;
                let from;
                if (parsedLog.name === 'BeneficiaryClaim') {
                    console.log('BeneficiaryClaim');
                    const beneficiaryAddress = parsedLog.args[0];
                    from = beneficiaryAddress;
                    const amount = parsedLog.args[1];
                    // const communityId = allCommunities.get(log.address)!;
                    txAt = await getBlockTime(log.blockHash);
                    try {
                        await Claim.create({
                            address: beneficiaryAddress,
                            communityId: availableCommunities[c].publicId,
                            amount,
                            tx: log.transactionHash,
                            txAt,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    } catch (e) {}
                } /* else if (parsedLog.name === 'ManagerAdded') {
                    const managerAddress = parsedLog.args[0];
                    await ManagerService.add(
                        managerAddress,
                        availableCommunities[c].publicId,
                    );
                }*/
                const hash = new SHA3(256);
                hash.update(log.transactionHash).update(
                    JSON.stringify(parsedLog.args)
                );
                try {
                    Transactions.create({
                        uid: hash.digest('hex'),
                        tx: log.transactionHash,
                        txAt,
                        from,
                        contractAddress: log.address,
                        event: parsedLog.name,
                        values: parsedLog.args,
                    });
                } catch (e) {}
            }
        }
    },
    down: (queryInterface) => {},
};
