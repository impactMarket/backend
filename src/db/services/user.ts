import { User } from '../models/user';


export default class UserService {
    public static async setUsername(
        address: string,
        username: string
    ): Promise<User | [number, User[]]> {
        const userExists = await User.findOne({ where: { address } });
        if (userExists !== null) {
            return User.update(
                { username },
                { returning: true, where: { address } },
            );
        }
        return User.create({
            address,
            username,
        });
    }

    public static async setCurrency(
        address: string,
        currency: string
    ): Promise<User | [number, User[]]> {
        const userExists = await User.findOne({ where: { address } });
        if (userExists !== null) {
            return User.update(
                { currency },
                { returning: true, where: { address } },
            );
        }
        return User.create({
            address,
            currency,
        });
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