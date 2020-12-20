import axios from 'axios';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

import config from './config';
import { Logger } from './loaders/logger';
import UserService from './services/user';
import { ICommunityInfo } from './types';

// Accepts the array and key
export function groupBy<T>(array: any[], key: string): Map<string, T[]> {
    // Return the end result
    return array.reduce((result, currentValue) => {
        let content = result.get(currentValue[key]);
        // If an array already present for key, push it to the array. Else create an array and push the object
        content === undefined
            ? (content = [currentValue])
            : content.push(currentValue);
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
            params: [
                blockHash,
                false
            ]
        };
        // handle success
        const requestHeaders = {
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            }
        };
        const response = await axios.post<{ result: { timestamp: string } }>(config.jsonRpcUrl, requestContent, requestHeaders);
        return new Date(parseInt(response.data.result.timestamp, 16) * 1000);
    } catch (e) {
        Logger.error('getBlockTime ' + e);
        return new Date();
    }
}

export async function notifyBackersCommunityLowFunds(
    community: ICommunityInfo,
    backersPushTokens: string[]
) {
    // Create a new Expo SDK client
    // optionally providing an access token if you have enabled push security
    const expo = new Expo();
    const basePushMessage: {
        sound?: 'default' | null | undefined;
        title?: string | undefined;
        body?: string | undefined;
        data?: object | undefined;
    } = {
        sound: 'default',
        title: 'A community you backed before is running out of funds.',
        body:
            community.name +
            ' currently has less than 10% of funds available to be claimed by end beneficiaries. Back them again by sending cUSD (Celo Dollar) to their community contract.',
        data: {
            action: 'community-low-funds',
            communityAddress: community.contractAddress,
        },
    };
    // Create the messages that you want to send to clients
    const messages: ExpoPushMessage[] = [];
    for (const pushToken of backersPushTokens) {
        // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

        // Check that all your push tokens appear to be valid Expo push tokens
        if (!Expo.isExpoPushToken(pushToken)) {
            Logger.debug(
                `Push token ${pushToken} is not a valid Expo push token`
            );
            continue;
        }

        // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
        messages.push({
            to: pushToken,
            ...basePushMessage,
        });
    }

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            // console.log(ticketChunk);
            tickets.push(...ticketChunk);
            // NOTE: If a ticket contains an error code in ticket.details.error, you
            // must handle it appropriately. The error codes are listed in the Expo
            // documentation:
            // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
        } catch (error) {
            Logger.error(error);
        }
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
    data: any
): Promise<boolean> {
    const user = await UserService.get(userAddress);
    if (user !== null && user.pushNotificationToken !== null && user.pushNotificationToken.length > 0) {
        const message = {
            to: user.pushNotificationToken,
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
            const result = await axios.post('https://exp.host/--/api/v2/push/send', message, requestHeaders);
            return result.status === 200 ? true : false;
        } catch (error) {
            Logger.error('Couldn\'t send notification ' + error + ' with request ' + JSON.stringify(message));
            return false;
        }
    }
    return false;
}

export function isUUID(s: string): boolean {
    const matchResult = s.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    return matchResult ? matchResult.length > 0 : false;
}