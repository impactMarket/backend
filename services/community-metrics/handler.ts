import { verifyDeletedAccounts } from './src/user';
import { calcuateCommunitiesMetrics } from './src/calcuateCommunitiesMetrics';
import { calcuateGlobalMetrics } from './src/calcuateGlobalMetrics';
import { services } from '@impactmarket/core';
import { updateExchangeRates } from './src/updateExchangeRates';

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

export const calculate = async (event, context) => {
    try {
        await calcuateCommunitiesMetrics();
    } catch (error) {
        console.error('Error calcuateCommunitiesMetrics: ', error);
        throw error;
    }
    try {
        await calcuateGlobalMetrics();
    } catch (error) {
        console.error('Error calcuateGlobalMetrics: ', error);
        throw error;
    }
    try {
        await verifyDeletedAccounts();
    } catch (error) {
        console.error('Error verifyDeletedAccounts: ', error);
        throw error;
    }
    try {
        const globalDemographicsService =
            new services.global.GlobalDemographicsService();
        const communityDemographicsService =
            new services.ubi.CommunityDemographicsService();

        await communityDemographicsService.calculate();
        await globalDemographicsService.calculate();
    } catch (error) {
        console.error('Error communityDemographicsService/globalDemographicsService: ', error);
        throw error;
    }
    try {
        await updateExchangeRates();
    } catch (error) {
        console.error('Error updateExchangeRates: ', error);
        throw error;
    }
};
