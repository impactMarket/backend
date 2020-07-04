import { User } from '../models/user';
import { ethers } from 'ethers';
import config from '../../config';
import { generateAccessToken } from '../../middlewares';


export default class UserService {
    public static async auth(
        address: string,
        signature: string
    ): Promise<string | undefined> {
        const addressFromSignature = ethers.utils.verifyMessage(config.messageSigned, signature);
        if (addressFromSignature.toLowerCase() === address.toLowerCase()) {
            const token = generateAccessToken(address);
            await User.create({
                address,
                authToken: token,
            });
            return token;
        }
        return undefined;
    }

    public static async setUsername(
        address: string,
        username: string
    ): Promise<boolean> {
        const updated = await User.update(
            { username },
            { returning: true, where: { address } },
        );
        return updated[0] > 0;
    }

    public static async setCurrency(
        address: string,
        currency: string
    ): Promise<boolean> {
        const updated = await User.update(
            { currency },
            { returning: true, where: { address } },
        );
        return updated[0] > 0;
    }

    public static async setPushNotificationsToken(
        address: string,
        pushNotificationToken: string
    ): Promise<boolean> {
        const updated = await User.update(
            { pushNotificationToken },
            { returning: true, where: { address } },
        );
        return updated[0] > 0;
    }

    public static async get(address: string): Promise<User | null> {
        return User.findOne({ where: { address } });
    }

    public static async mappedNames(): Promise<Map<string, string>> {
        const mapped = new Map<string, string>();
        const query = await User.findAll();
        for (let index = 0; index < query.length; index++) {
            const element = query[index];
            mapped.set(element.address, element.username);
        }
        return mapped;
    }
}