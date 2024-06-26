import { Op } from 'sequelize';
import { database, interfaces, subgraph, utils } from '@impactmarket/core';
import { registerReceivables, registerReceivablesRepayments } from './huma';

const { LoanManagerFundsSource } = interfaces.microcredit.microCreditLoanManager;
const { models } = database;
const { microcredit } = subgraph.queries;

type HumaFundingData = {
    amountDeposited: number;
    amountUsed: number;
    finalizedAt: number;
    lastSyncAt: number;
    lastRepaymentSyncAt: number;
};

export async function validateBorrowersClaimHumaFunds(): Promise<void> {
    utils.Logger.info('Verifying borrowers claiming HUMA funds...');
    // set newLastSyncAt
    // needs to be updated at the biginning so we don't risk losing any registry
    const newLastSyncAt = Math.trunc(new Date().getTime() / 1000);

    // check if there's any HUMA funding set
    const humaFunding = await models.imMetadata.findOne({
        where: {
            key: 'humaFunding'
        }
    });

    if (!humaFunding) {
        utils.Logger.info('No HUMA funding set, skipping...');
        return;
    }

    const humaFundingData: HumaFundingData = JSON.parse(humaFunding.value);

    if (humaFundingData.finalizedAt !== 0) {
        utils.Logger.info('HUMA funding already finalized, skipping...');
        return;
    }


    // get all loans since the last check and filter until it get close to funding limit but does not overflow it
    const loanManagers = await models.microCreditLoanManager.findAll({
        attributes: [],
        include: [
            {
                model: models.appUser,
                as: 'user',
                attributes: ['address']
            }
        ],
        where: {
            fundsSource: {
                [Op.contains]: [LoanManagerFundsSource.HUMA]
            }
        }
    });
    const loans = await microcredit.getLoansSince(
        humaFundingData.lastSyncAt,
        loanManagers.map(loanManager => loanManager.user!.address.toLowerCase())
    );
    let accumulatedAmount = 0;
    let loanIndex = 0;

    for (; loanIndex < loans.length; loanIndex++) {
        if (
            accumulatedAmount + loans[loanIndex].amount + humaFundingData.amountUsed >
            humaFundingData.amountDeposited
        ) {
            break;
        }
        accumulatedAmount += loans[loanIndex].amount;
    }

    // register all of them
    utils.Logger.info(`Registering ${loanIndex} loans...`);
    await registerReceivables(loans.slice(0, loanIndex));

    // update imMetadata
    humaFundingData.lastSyncAt = newLastSyncAt;
    humaFundingData.amountUsed += accumulatedAmount;
    // if all funds are used, set as finalized
    if (
        accumulatedAmount + humaFundingData.amountUsed === humaFundingData.amountDeposited ||
        loanIndex < loans.length
    ) {
        humaFundingData.finalizedAt = Math.trunc(new Date().getTime() / 1000);
    }

    await humaFunding.update({
        value: JSON.stringify(humaFundingData)
    });

    utils.Logger.info('Updated HUMA receivables!');
}

export async function validateBorrowersRepayingHumaFunds(): Promise<void> {
    utils.Logger.info('Verifying borrowers repaying HUMA funds...');
    const newLastRepaymentSyncAt = Math.trunc(new Date().getTime() / 1000);

    // check if there's any HUMA funding set
    const humaFunding = await models.imMetadata.findOne({
        where: {
            key: 'humaFunding'
        }
    });

    if (!humaFunding) {
        utils.Logger.info('No HUMA funding set, skipping...');
        return;
    }

    const humaFundingData: HumaFundingData = JSON.parse(humaFunding.value);

    if (humaFundingData.finalizedAt !== 0) {
        utils.Logger.info('HUMA funding already finalized, skipping...');
        return;
    }

    // get loans with HUMA referenceId
    const loansReferenceIds = await models.microCreditBorrowersHuma.findAll({
        attributes: ['humaRWRReferenceId']
    });

    // get all repayments to those loans since the last check
    const repayments = await microcredit.getLoansRepaymentsSince(
        loansReferenceIds.map(loan => loan.humaRWRReferenceId),
        humaFundingData.lastRepaymentSyncAt
    );

    // update recevables with repayments
    await registerReceivablesRepayments(repayments);

    humaFundingData.lastRepaymentSyncAt = newLastRepaymentSyncAt;
    await humaFunding.update({
        value: JSON.stringify(humaFundingData)
    });

    utils.Logger.info('Updated HUMA repayments!');
}
