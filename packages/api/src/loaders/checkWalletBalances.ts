import { Contract, parseEther, formatEther, JsonRpcProvider } from 'ethers';
import config from '../config';
import { sendEmail } from '../services/email';
import { utils } from '@impactmarket/core';

// using ethers, verify the balance of cusd (an erc20) on a given account
// if below X, send email to someone
export async function checkWalletBalances() {
    utils.Logger.info('🕵️ Running checkLearnAndEarnBalances...');
    const accounts = config.hotWalletsCheckBalance.split(';');
    const provider = new JsonRpcProvider(config.jsonRpcUrl);
    const contract = new Contract(config.cUSDContractAddress, [
        'function balanceOf(address account) view returns (uint256)',
    ], provider);

    const balancePromises = accounts.map(async (account) => {
        const balance = await contract.balanceOf(account);
        return { account, balance };
    });

    const balances = await Promise.all(balancePromises);

    balances.forEach(({ account, balance }) => {
        // send email if balance is low
        if (balance.lt(parseEther('0.05'))) {
            sendEmail({
                to: 'developers@impactmarket.com',
                from: 'hello@impactmarket.com',
                subject: 'Low cUSD balance',
                text: `cUSD balance for ${account} is ${formatEther(balance)}`,
            });
        }
    });

}