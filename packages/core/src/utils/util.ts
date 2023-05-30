import { getAddress } from '@ethersproject/address';
import BigNumber from 'bignumber.js';

import { BaseError } from './baseError';

BigNumber.config({ EXPONENTIAL_AT: [-7, 30] });

export function calculateGrowth(past: string | BigInt | number, now: string | BigInt | number): number {
    let r: number | undefined = undefined;
    if (typeof past === 'string' && typeof now === 'string') {
        r = new BigNumber(now).minus(new BigNumber(past)).dividedBy(new BigNumber(past)).multipliedBy(100).toNumber();
    } else if (typeof past === 'bigint' && typeof now === 'bigint') {
        r = new BigNumber(now.toString())
            .minus(new BigNumber(past.toString()))
            .dividedBy(new BigNumber(past.toString()))
            .multipliedBy(100)
            .toNumber();
    } else if (typeof past === 'number' && typeof now === 'number') {
        r = ((now - past) / Math.abs(past)) * 100;
    }
    if (r !== undefined) {
        return Math.round(r * 10) / 10;
    }
    throw new Error('Invalid input!');
}

export function isAddress(s: string): boolean {
    const matchResult = s.match(/^0x[a-fA-F0-9]{40}$/i);
    return matchResult ? matchResult.length > 0 : false;
}

export const getSearchInput = (searchInput: string) => {
    if (isAddress(searchInput)) {
        return {
            address: getAddress(searchInput.toLowerCase())
        };
    } else if (
        searchInput.toLowerCase().indexOf('drop') === -1 &&
        searchInput.toLowerCase().indexOf('delete') === -1 &&
        searchInput.toLowerCase().indexOf('update') === -1
    ) {
        return {
            name: searchInput
        };
    } else {
        throw new BaseError('INVALID_SEARCH', 'Not valid search!');
    }
};
