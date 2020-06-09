import { Username } from '../models/username';


export default class UsernameService {
    public static async set(
        address: string,
        username: string
    ) {
        const userExists = await Username.findOne({ where: { address } });
        if (userExists !== null) {
            return Username.update(
                { username },
                { returning: true, where: { address } },
            );
        }
        return Username.create({
            address,
            username,
        });
    }

    public static async get(address: string) {
        return Username.findOne({ where: { address } });
    }

    public static async getAll() {
        return Username.findAll();
    }

    public static async mappedNames(): Promise<Map<string, string>> {
        const mapped = new Map<string, string>();
        const query = await Username.findAll();
        for (let index = 0; index < query.length; index++) {
            const element = query[index];
            mapped.set(element.address, element.username);
        }
        return mapped;
    }
}