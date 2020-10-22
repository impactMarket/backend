import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import axios from 'axios';
import UserService from "./services/user";
import Logger from './loaders/logger';
import { ICommunityInfo } from './types';

// Accepts the array and key
export function groupBy<T>(array: any[], key: string): Map<string, T[]> {
    // Return the end result
    return array.reduce((result, currentValue) => {
        let content = result.get(currentValue[key]);
        // If an array already present for key, push it to the array. Else create an array and push the object
        (content === undefined) ? content = [currentValue] : content.push(currentValue);
        // Return the current iteration `result` value, this will be taken as next iteration `result` value and accumulate
        return result.set(currentValue[key], content);
    }, new Map<string, T[]>()); // empty map is the initial value for result object
}

export async function notifyBackersCommunityLowFunds(community: ICommunityInfo, backersPushTokens: string[]) {
    // Create a new Expo SDK client
    // optionally providing an access token if you have enabled push security
    const expo = new Expo();
    const basePushMessage: {
        sound?: "default" | null | undefined;
        title?: string | undefined;
        body?: string | undefined;
        data?: object | undefined;
    } = {
        sound: 'default',
        title: 'A community you backed before is running out of funds.',
        body: community.name + ' currently has less than 10% of funds available to be claimed by end beneficiaries. Back them again by sending cUSD (Celo Dollar) to their community contract.',
        data: {
            action: "community-low-funds",
            communityAddress: community.contractAddress
        },
    }
    // Create the messages that you want to send to clients
    let messages: ExpoPushMessage[] = [];
    for (let pushToken of backersPushTokens) {
        // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

        // Check that all your push tokens appear to be valid Expo push tokens
        if (!Expo.isExpoPushToken(pushToken)) {
            Logger.debug(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
        }

        // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
        messages.push({
            to: pushToken,
            ...basePushMessage
        })
    }

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    expo.chunkPushNotifications(messages);
}

export async function sendPushNotification(userAddress: string, title: string, body: string, data: any): Promise<boolean> {
    const user = await UserService.get(userAddress);
    if (user !== null) {
        try {
            const message = {
                to: user.pushNotificationToken,
                sound: 'default',
                title,
                body,
                color: "#2400ff",
                data,
            };
            // handle success
            const requestHeaders = {
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                }
            };
            const result = await axios.post('https://exp.host/--/api/v2/push/send', JSON.stringify(message), requestHeaders);
            return result.status === 200 ? true : false;
        } catch (error) {
            Logger.error(error);
            return false;
        }
    }
    return false;
}

