'use strict';

const BigNumber = require('bignumber.js');
const axios = require('axios');
const { ethers } = require('ethers');

const ERC20ABI = require('../../contracts/ERC20ABI.json');

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
        const Inflow = await queryInterface.sequelize.define(
            'inflow',
            {
                id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                },
                from: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                },
                contractAddress: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                },
                amount: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(29), // max 9,999,999,999 - plus 18 decimals
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
                asset: {
                    type: Sequelize.INTEGER,
                    defaultValue: 0,
                    allowNull: false,
                },
                value: {
                    type: Sequelize.DECIMAL(29), // max 9,999,999,999 - plus 18 decimals
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
                tableName: 'inflow',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        const provider = new ethers.providers.JsonRpcProvider(
            process.env.CHAIN_JSON_RPC_URL
        );
        let fromBlock = 10611000;
        let toBreak = false;
        for (;;) {
            const block = await provider.getBlockNumber();
            let toBlock = fromBlock;
            if (fromBlock + 1000 > block) {
                toBlock = block;
                toBreak = true;
            } else {
                toBlock = fromBlock + 1000;
            }
            // get past donations
            const logsCUSD = await provider.getLogs({
                fromBlock: fromBlock,
                toBlock: toBlock,
                address: process.env.CUSD_CONTRACT_ADDRESS,
                topics: [
                    [ethers.utils.id('Transfer(address,address,uint256)')],
                ],
            });
            const ifaceERC20 = new ethers.utils.Interface(ERC20ABI);
            const eventsCUSD = logsCUSD.map((log) => ifaceERC20.parseLog(log));
            for (let ec = 0; ec < eventsCUSD.length; ec += 1) {
                // console.log(eventsCUSD[ec].args.to);
                if (
                    eventsCUSD[ec].args.to.toLowerCase() ===
                    process.env.TREASURY_DAO_ADDRESS.toLowerCase()
                ) {
                    const log = logsCUSD[ec];
                    const parsedLog = eventsCUSD[ec];
                    //
                    const amount = parsedLog.args[2].toString();
                    const txAt = await getBlockTime(log.blockHash);
                    try {
                        // console.log(
                        //     parsedLog.args[0],
                        //     parsedLog.args[1],
                        //     parsedLog.args[2].toString()
                        // );
                        await Inflow.create({
                            from: parsedLog.args[0],
                            contractAddress: process.env.TREASURY_DAO_ADDRESS,
                            amount,
                            tx: log.transactionHash,
                            txAt,
                            value: amount,
                            assset: 0,
                        });
                    } catch (e) {}
                }
            }
            fromBlock += 1000;
            if (toBreak) {
                break;
            }
        }
    },
    down: (queryInterface) => {},
};
