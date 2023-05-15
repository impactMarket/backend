import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';
import { JsonRpcProvider } from '@ethersproject/providers';
import config from '../config';
import { sendEmail } from '../services/email';
import { database, utils } from '@impactmarket/core';

const { models } = database;
const LearnAndEarnAbi = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "levels",
        "outputs": [
            {
                "internalType": "contract IERC20Upgradeable",
                "name": "token",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "balance",
                "type": "uint256"
            },
            {
                "internalType": "enum ILearnAndEarn.LevelState",
                "name": "state",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

// using ethers, verify the balance of each level on LearnAndEarn and if below X, send email to someone
export async function checkLearnAndEarnBalances() {
    utils.Logger.info('🕵️ Running checkLearnAndEarnBalances...');
    const provider = new JsonRpcProvider(config.jsonRpcUrl);
    const learnAndEarn = new Contract(config.contractAddresses.learnAndEarn, LearnAndEarnAbi, provider);

    const levels = await models.learnAndEarnLevel.findAll({ where: { isLive: true, active: true } });

    for (let i = 0; i < levels.length; i++) {
        const level = await learnAndEarn.levels(levels[i].id);
        const balance = parseFloat(formatEther(level.balance));
        // send email if balance is not enough for 100 users
        if (balance < levels[i].totalReward * 100) {
            sendEmail({
                to: 'developers@impactmarket.com',
                from: 'hello@impactmarket.com',
                subject: `LearnAndEarn low balance`,
                text: `LearnAndEarn balance for level ${levels[i].id} is ${balance}`
            });
        }
    }
}