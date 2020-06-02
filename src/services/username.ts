import { Username } from '../models/username';


export default class UsernameService {
    public static async set(
        address: string,
        username: string
    ) {
        const userExists = await Username.findOne({ where: { address } });
        if (userExists !== undefined) {
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
}