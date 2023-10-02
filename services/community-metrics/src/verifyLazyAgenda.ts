import { MailDataRequired } from '@sendgrid/mail';
import { config, database, utils } from '@impactmarket/core';
import { ethers } from 'ethers';
import { sendEmail } from '@impactmarket/core/src/services/email';

const { sequelize, models } = database;
const { appLazyAgenda } = models;

enum LazyAgendaType {
    RECURRING_DONATION = 0
}

interface DonationMinerContract extends ethers.Contract {
    donate(
        token: string,
        amount: ethers.BigNumber,
        delegateAddress: string
    ): Promise<ethers.providers.TransactionResponse>;
}

const donationMinerABI = [
    {
        inputs: [
            {
                internalType: 'contract IERC20Upgradeable',
                name: '_token',
                type: 'address'
            },
            {
                internalType: 'uint256',
                name: '_amount',
                type: 'uint256'
            },
            {
                internalType: 'address',
                name: '_from',
                type: 'address'
            },
            {
                internalType: 'address',
                name: '_delegateAddress',
                type: 'address'
            }
        ],
        name: 'donateFrom',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    }
];

const erc20ABI = [
    {
        type: 'function',
        stateMutability: 'view',
        payable: false,
        outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
        name: 'allowance',
        inputs: [
            { type: 'address', name: 'accountOwner', internalType: 'address' },
            { type: 'address', name: 'spender', internalType: 'address' }
        ],
        constant: true
    }
];

export async function verifyLazyAgenda(): Promise<void> {
    utils.Logger.info('Verifying user accounts to delete...');

    // get all lazy agenda items that are due to be executed (lastExecutedAt + frequency < now)
    // frequency can be any number of seconds
    // include user address from app_user table
    const lazyAgendaItems = await appLazyAgenda.findAll({
        where: sequelize.literal(
            `(${Math.trunc(new Date().getTime() / 1000)} - frequency) >= TRUNC(EXTRACT(EPOCH FROM "lastExecutedAt"))`
        ),
        include: [{ attributes: ['address', 'email', 'firstName'], model: models.appUser, as: 'user' }]
    });

    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);

    // for each lazy agenda item, execute the corresponding action
    for (let i = 0; i < lazyAgendaItems.length; i++) {
        const lazyAgendaItem = lazyAgendaItems[i];
        const { type, details, user } = lazyAgendaItem;
        switch (type) {
            case LazyAgendaType.RECURRING_DONATION:
                // execute the donation
                const lazyAgendaTxExecutor = new ethers.Wallet(config.wallets.recurringDonationPrivateKey, provider);
                const donationMinerContract = new ethers.Contract(
                    config.contractAddresses.donationMiner,
                    donationMinerABI,
                    lazyAgendaTxExecutor
                ) as DonationMinerContract;
                try {
                    const txPopulate = await donationMinerContract.populateTransaction.donateFrom(
                        config.cUSDContractAddress,
                        ethers.utils.parseEther((details as { amount: number }).amount.toString()),
                        user!.address,
                        user!.address
                    );
                    const gasLimit = await lazyAgendaTxExecutor.estimateGas(txPopulate);
                    const gasPrice = await provider.getGasPrice();
                    const tx = await lazyAgendaTxExecutor.sendTransaction({ ...txPopulate, gasLimit, gasPrice });

                    await tx.wait();

                    // update the lastExecutedAt field
                    lazyAgendaItem.update({ lastExecutedAt: new Date() });

                    // TODO: if allowance is getting low, notify user to increase it
                } catch (e) {
                    // email the user that the donation failed
                    // build the email structure and send
                    //  allowance(owner, spender)
                    const cusdContract = new ethers.Contract(config.cUSDContractAddress, erc20ABI, provider);
                    const isBelowAllowance = ethers.utils
                        .parseEther((details as { amount: number }).amount.toString())
                        .gt(await cusdContract.allowance(user!.address, config.contractAddresses.donationMiner));
                    if (isBelowAllowance) {
                        const dynamicTemplateData = {
                            subject: 'Recurring donation',
                            message: 'There was an error with your recurring donation!'
                        };
                        const personalizations = [
                            {
                                to: [{ email: user!.email }],
                                dynamicTemplateData
                            }
                        ];
                        const sendgridData: MailDataRequired = {
                            from: {
                                name: 'impactMarket',
                                email: 'no-reply@impactmarket.com'
                            },
                            personalizations,
                            templateId: 'd-2ed3ec93a94246478fcfd6650bb60375'
                        };
                        sendEmail(sendgridData);
                    }
                }
                break;
            default:
                break;
        }
    }
}
