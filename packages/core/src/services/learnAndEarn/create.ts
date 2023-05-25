import { models } from '../../database';

export async function createLevel(userId: number, rules: { [key: string]: any }) {
    const level = await models.learnAndEarnLevel.create({
        adminUserId: userId,
        rules,
    });
    
    return level;
}