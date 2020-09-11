import axios from 'axios';
import UserService from "./db/services/user";
import Logger from './loaders/logger';

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