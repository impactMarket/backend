import { calcuateCommunitiesMetrics } from './src/calcuateCommunitiesMetrics';

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

export const calculate = async (event, context) => {
    try {
        await calcuateCommunitiesMetrics();
    } catch (error) {
        console.error('Error: ', error);
        throw error;
    }
};

calculate({}, {});
