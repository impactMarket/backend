import { models } from '../../database';

export async function createLevel(userId: number) {
    const level = await models.learnAndEarnLevel.create({
        adminUserId: userId,
    });
    
    return level;
}