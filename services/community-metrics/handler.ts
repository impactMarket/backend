import {
    calcuateCommunitiesDemographics,
    calcuateCommunitiesMetrics,
    calculateGlobalDemographics
} from './src/calcuateCommunitiesMetrics';
import { calcuateGlobalMetrics } from './src/calcuateGlobalMetrics';
import { calculateBorrowersPerformance } from './src/calculateBorrowersPerformance';
import { updateExchangeRates } from './src/updateExchangeRates';
import { validateBorrowersClaimHumaFunds, validateBorrowersRepayingHumaFunds } from './src/validateHumaBorrowers';
import { verifyDeletedAccounts } from './src/user';
import { updateCommunities } from './src/updateCommunities';

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

validateBorrowersClaimHumaFunds();
