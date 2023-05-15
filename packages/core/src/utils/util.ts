import { getAddress } from '@ethersproject/address';
import axios from 'axios';
import BigNumber from 'bignumber.js';

import config from '../config';
import { BaseError } from './baseError';
import { Logger } from './logger';

BigNumber.config({ EXPONENTIAL_AT: [-7, 30] });

export function calculateGrowth(
    past: string | BigInt | number,
    now: string | BigInt | number
): number {
    let r: number | undefined = undefined;
    if (typeof past === 'string' && typeof now === 'string') {
        r = new BigNumber(now)
            .minus(new BigNumber(past))
            .dividedBy(new BigNumber(past))
            .multipliedBy(100)
            .toNumber();
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

// Accepts the array and key
export function groupBy<T>(array: any[], key: string): Map<string, T[]> {
    // Return the end result
    return array.reduce((result, currentValue) => {
        let content = result.get(currentValue[key]);
        // If an array already present for key, push it to the array. Else create an array and push the object
        if (content === undefined) {
            content = [currentValue];
        } else {
            content.push(currentValue);
        }
        // Return the current iteration `result` value, this will be taken as next iteration `result` value and accumulate
        return result.set(currentValue[key], content);
    }, new Map<string, T[]>()); // empty map is the initial value for result object
}

export async function getBlockTime(blockHash: string): Promise<Date> {
    try {
        const requestContent = {
            id: 0,
            jsonrpc: '2.0',
            method: 'eth_getBlockByHash',
            params: [blockHash, false],
        };
        // handle success
        const requestHeaders = {
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        };
        const response = await axios.post<{ result: { timestamp: string } }>(
            config.jsonRpcUrl,
            requestContent,
            requestHeaders
        );
        return new Date(parseInt(response.data.result.timestamp, 16) * 1000);
    } catch (e) {
        Logger.error(`getBlockTime "${e}" - Returning current date!`);
        return new Date();
    }
}

export function isAddress(s: string): boolean {
    const matchResult = s.match(/^0x[a-fA-F0-9]{40}$/i);
    return matchResult ? matchResult.length > 0 : false;
}

export const getSearchInput = (searchInput: string) => {
    if (isAddress(searchInput)) {
        return {
            address: getAddress(searchInput.toLowerCase()),
        };
    } else if (
        searchInput.toLowerCase().indexOf('drop') === -1 &&
        searchInput.toLowerCase().indexOf('delete') === -1 &&
        searchInput.toLowerCase().indexOf('update') === -1
    ) {
        return {
            name: searchInput,
        };
    } else {
        throw new BaseError('INVALID_SEARCH', 'Not valid search!');
    }
};
