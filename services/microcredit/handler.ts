import { updateBorrowers } from './src/borrowers';
import { welcome, increasingInterest } from './src/notification';
import { utils, config } from '@impactmarket/core';

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

export const borrowers = async (event, context) => {
    await updateBorrowers();
};

export const notification = async (event, context) => {
    // a welcome/reminder 1 week after receiving the loan
    try {
        await welcome();
        utils.Logger.info('Sent welcome/reminder notification!');
    } catch (error) {
        utils.Logger.error('Error welcome/reminder notification: ', error);
        utils.slack.sendSlackMessage('🚨 Error to send welcome/reminder notification', config.slack.lambdaChannel);
    }

    // every 2 weeks, remind the borrower about the loan and increasing interest
    try {
        await increasingInterest();
        utils.Logger.info('Remind increasing interest!');
    } catch (error) {
        utils.Logger.error('Error remind increasing interest: ', error);
        utils.slack.sendSlackMessage('🚨 Error to remind increasing interest', config.slack.lambdaChannel);
    }

    // if halfway through the loan, the borrower didn't repay yet, start notifying every 2 weeks

    // if the borrower repaid something, but the performance is now below 100%, notify the borrower 

    // if the borrower repaid something in the last month and the performance is above 100%, notify the borrower only once
};

notification(null, null)