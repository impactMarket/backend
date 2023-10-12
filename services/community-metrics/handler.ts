import {
    calcuateCommunitiesDemographics,
    calcuateCommunitiesMetrics,
    calculateGlobalDemographics
} from './src/calcuateCommunitiesMetrics';
import { calcuateGlobalMetrics } from './src/calcuateGlobalMetrics';
import { calculateBorrowersPerformance } from './src/calculateBorrowersPerformance';
import { updateCommunities } from './src/updateCommunities';
import { updateExchangeRates } from './src/updateExchangeRates';
import { validateBorrowersClaimHumaFunds, validateBorrowersRepayingHumaFunds } from './src/validateHumaBorrowers';
import { verifyDeletedAccounts } from './src/user';
import { verifyLazyAgenda } from './src/verifyLazyAgenda';

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

export const calculate = async (event, context) => {
    const today = new Date();

    if (today.getHours() <= 1) {
        await Promise.all([
            calcuateCommunitiesMetrics(),
            calcuateGlobalMetrics(),
            calcuateCommunitiesDemographics(),
            calculateGlobalDemographics()
        ]);
    } else if (today.getHours() <= 2) {
        await Promise.all([verifyDeletedAccounts(), updateExchangeRates()]);
    } else if (today.getHours() <= 4) {
        await calculateBorrowersPerformance();
    } else if (today.getHours() <= 6) {
        // can't execute in parallel because someone can get a loan
        // and repay it before this function is executed
        await validateBorrowersClaimHumaFunds();
        await validateBorrowersRepayingHumaFunds();
    } else if (today.getHours() <= 8) {
        await updateCommunities();
    } else if (today.getHours() <= 10) {
        await verifyLazyAgenda();
    }
};
