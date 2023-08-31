import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { database, utils } from '@impactmarket/core';
import { formatEther, parseEther } from '@ethersproject/units';
import { sendEmail } from '../services/email';
import config from '../config';

const redisKeyStatus = 'lastWalletEmailTimestamp';

// using ethers, verify the balance of cusd (an erc20) on a given account
// if below X, send email to someone
export async function checkWalletBalances() {
    utils.Logger.info('🕵️ Running checkWalletBalances...');
    const lastEmailTimestamp = await database.redisClient.get(redisKeyStatus);
    if (lastEmailTimestamp) {
        if (Date.now() - parseInt(lastEmailTimestamp, 10) < 1000 * 60 * 60 * 24) {
            // don't send email if we sent one in the last 24 hours

            utils.Logger.info('🕵️ Running checkWalletBalances: emails were recently sent!');
            return;
        }
    }
    await database.redisClient.set(redisKeyStatus, Date.now(), 'EX', 86400);

    const accounts = config.hotWalletsCheckBalance.split(';');
    const provider = new JsonRpcProvider(config.jsonRpcUrl);
    const contract = new Contract(
        config.cUSDContractAddress,
        ['function balanceOf(address account) view returns (uint256)'],
        provider
    );

    const balancePromises = accounts.map(async account => {
        const balance = await contract.balanceOf(account);
        return { account, balance };
    });

    const balances = await Promise.all(balancePromises);

    balances.forEach(({ account, balance }) => {
        // send email if balance is low
        if (balance.lt(parseEther('0.05'))) {
            sendEmail({
                to: 'developers@impactmarket.com',
                from: 'no-reply@impactmarket.com',
                subject: `${config.chain.isMainnet ? '' : '[TESTNET] '}Low cUSD balance`,
                text: `cUSD balance for ${account} is ${formatEther(balance)}`
            });
        }
    });
}
