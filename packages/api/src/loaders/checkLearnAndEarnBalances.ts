import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { database, utils } from '@impactmarket/core';
import { formatEther } from '@ethersproject/units';
import { sendEmail } from '../services/email';
import config from '../config';

const { models } = database;
const LearnAndEarnAbi = [
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256'
            }
        ],
        name: 'levels',
        outputs: [
            {
                internalType: 'contract IERC20Upgradeable',
                name: 'token',
                type: 'address'
            },
            {
                internalType: 'uint256',
                name: 'balance',
                type: 'uint256'
            },
            {
                internalType: 'enum ILearnAndEarn.LevelState',
                name: 'state',
                type: 'uint8'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const redisKeyStatus = 'lastLearnAndEarnEmailTimestamp';

// using ethers, verify the balance of each level on LearnAndEarn and if below X, send email to someone
export async function checkLearnAndEarnBalances() {
    utils.Logger.info('🕵️ Running checkLearnAndEarnBalances...');
    const lastEmailTimestamp = await database.redisClient.get(redisKeyStatus);
    if (lastEmailTimestamp) {
        if (Date.now() - parseInt(lastEmailTimestamp, 10) < 1000 * 60 * 60 * 24) {
            // don't send email if we sent one in the last 24 hours

            utils.Logger.info('🕵️ Running checkLearnAndEarnBalances: emails were recently sent!');
            return;
        }
    }
    await database.redisClient.set(redisKeyStatus, Date.now(), 'EX', 86400);
    const provider = new JsonRpcProvider(config.jsonRpcUrl);
    const learnAndEarn = new Contract(config.contractAddresses.learnAndEarn, LearnAndEarnAbi, provider);

    const levels = await models.learnAndEarnLevel.findAll({
        where: { isLive: true, active: true },
        include: [{ model: models.appUser, as: 'adminUserId', required: false }]
    });

    for (let i = 0; i < levels.length; i++) {
        const level = await learnAndEarn.levels(levels[i].id);
        const balance = parseFloat(formatEther(level.balance));
        // send email if balance is not enough for 100 users
        if (balance < levels[i].totalReward * 100) {
            sendEmail({
                to: levels[i].adminUser?.email || 'developers@impactmarket.com',
                from: 'hello@impactmarket.com',
                subject: `${config.chain.isMainnet ? '' : '[TESTNET] '}LearnAndEarn low balance`,
                text: `LearnAndEarn balance for level ${levels[i].id} is ${balance}`
            });
        }
    }
}
