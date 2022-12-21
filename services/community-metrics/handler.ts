import { calcuateCommunitiesMetrics } from './src/calcuateCommunitiesMetrics';
import { calcuateGlobalMetrics } from './src/calcuateGlobalMetrics';

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

export const calculate = async (event, context) => {
    try {
        await calcuateCommunitiesMetrics();
        await calcuateGlobalMetrics();
    } catch (error) {
        console.error('Error: ', error);
        throw error;
    }
};
