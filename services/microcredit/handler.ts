import 'cross-fetch/polyfill';
import { updateBorrowers, updateCurrentDebt } from './src/borrowers';
import { welcome, increasingInterest, unpaidLoan, lowPerformance, highPerformance, reachingMaturity } from './src/notification';
import { utils, config } from '@impactmarket/core';

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
global.fetch = require('node-fetch').default;

export const borrowers = async (event, context) => {
    await updateBorrowers();
};

export const currentDebt = async (event, context) => {
    await updateCurrentDebt();
};

export const notification = async (event, context) => {
    // a welcome/reminder 1 week after receiving the loan
    try {
        await welcome();
        utils.Logger.info('Sent welcome/reminder notification!');
    } catch (error) {
        utils.Logger.error('Error welcome/reminder notification: ', error);
        throw error;
    }

    // if the borrower repaid something in the last month and the performance is above 100%, notify the borrower only once
    try {
        await highPerformance();
        utils.Logger.info('notify high performance!');
    } catch (error) {
        utils.Logger.error('Error notify high performance: ', error);
        throw error;
    }

    // if the borrower repaid something, but the performance is now below 100%, notify the borrower 
    try {
        await lowPerformance();
        utils.Logger.info('notify low performance!');
    } catch (error) {
        utils.Logger.error('Error notify low performance: ', error);
        throw error;
    }

    // if halfway through the loan, the borrower didn't repay yet, start notifying every 2 weeks
    try {
        await unpaidLoan();
        utils.Logger.info('Remind unpaid loan loan!');
    } catch (error) {
        utils.Logger.error('Error remind unpaid loan loan: ', error);
        throw error;
    }

    // every 2 weeks, remind the borrower about the loan and increasing interest
    try {
        await increasingInterest();
        utils.Logger.info('Remind increasing interest!');
    } catch (error) {
        utils.Logger.error('Error remind increasing interest: ', error);
        throw error;
    }

    // one week before reaching maturity and 24 hours again
    try {
        await reachingMaturity();
        utils.Logger.info('Remind reaching maturity!');
    } catch (error) {
        utils.Logger.error('Error remind reaching maturity: ', error);
        throw error;
    }
};
