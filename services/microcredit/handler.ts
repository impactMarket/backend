import { updateBorrowers } from './src/borrowers';

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

export const borrowers = async (event, context) => {
    await updateBorrowers();
};
