import { User } from '../models/user';
import { generateAccessToken } from '../../middlewares';


export default class UserService {
    public static async auth(
        address: string,
    ): Promise<string | undefined> {
        const token = generateAccessToken(address);
        const user = await User.findOne({ where: { address } });
        if (user === null) {
            await User.create({
                address,
                pin: '123', // not used anymore
                authToken: token,
                avatar: Math.floor(Math.random() * 8) + 1,
            });
        } else {
            await User.update(
                { authToken: token },
                { returning: true, where: { address } },
            );
        }
        return token;
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

    public static async setLanguage(
        address: string,
        language: number
    ): Promise<boolean> {
        const updated = await User.update(
            { language },
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