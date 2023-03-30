import { getAddress } from '@ethersproject/address';
import axios from 'axios';
import BigNumber from 'bignumber.js';

import config from '../config';
import { AppMediaThumbnail } from '../interfaces/app/appMediaThumbnail';
import UserService from '../services/app/user';
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

export async function notifyBeneficiaryAdded(
    userAddress: string,
    communityAddress: string
): Promise<boolean> {
    return await sendPushNotification(
        userAddress,
        'Welcome',
        "You've been added as a beneficiary!",
        {
            action: 'beneficiary-added',
            communityAddress,
        }
    );
}

export async function notifyManagerAdded(
    managerAddress: string,
    communityAddress: string
): Promise<boolean> {
    return await sendPushNotification(
        managerAddress,
        'Community Accepted',
        'Your community was accepted!',
        {
            action: 'community-accepted',
            communityAddress,
        }
    );
}

export async function sendPushNotification(
    userAddress: string,
    title: string,
    body: string,
    data: any,
    pushNotificationToken?: string | null
): Promise<boolean> {
    if (!pushNotificationToken) {
        const user = await UserService.get(userAddress);
        if (!user) return false;
        pushNotificationToken = user.pushNotificationToken;
    }
    if (pushNotificationToken !== null && pushNotificationToken.length > 0) {
        const message = {
            to: pushNotificationToken,
            sound: 'default',
            title,
            body,
            color: '#2400ff',
            data,
        };
        try {
            // handle success
            const requestHeaders = {
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
            };
            const result = await axios.post(
                'https://exp.host/--/api/v2/push/send',
                message,
                requestHeaders
            );
            return result.status === 200;
        } catch (error) {
            Logger.error(
                "Couldn't send notification " +
                    error +
                    ' with request ' +
                    JSON.stringify(message)
            );
            return false;
        }
    }
    return false;
}

export async function sendFirebasePushNotification(title: string, body: string, token: string) {
    try {
        const message = {
            notification: {
                title,
                body
            },
            token,
        };

        await axios.post(
            'https://fcm.googleapis.com/fcm/send',
            JSON.stringify(message),
            {
                headers: {
                    Authorization: 'key=' + config.firebaseKey,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Push notification failed');
    }
}

export function isUUID(s: string): boolean {
    const matchResult = s.match(
        /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
    );
    return matchResult ? matchResult.length > 0 : false;
}

export function isAddress(s: string): boolean {
    const matchResult = s.match(/^0x[a-fA-F0-9]{40}$/i);
    return matchResult ? matchResult.length > 0 : false;
}

export function createThumbnailUrl(
    bucket: string,
    key: string,
    thumbnailSizes: { width: number; height: number }[]
): AppMediaThumbnail[] {
    const avatar: AppMediaThumbnail[] = [];
    for (let i = 0; i < config.thumbnails.pixelRatio.length; i++) {
        const pr = config.thumbnails.pixelRatio[i];
        for (let i = 0; i < thumbnailSizes.length; i++) {
            const size = thumbnailSizes[i];
            const body = {
                bucket,
                key,
                edits: {
                    resize: {
                        width: size.width * pr,
                        height: size.height * pr,
                        fit: 'inside',
                    },
                },
            };

            const url = `${config.imageHandlerUrl}/${Buffer.from(
                JSON.stringify(body)
            ).toString('base64')}`;
            avatar.push({
                url,
                width: size.width,
                height: size.height,
                pixelRatio: pr,
            } as any);
        }
    }

    return avatar;
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
