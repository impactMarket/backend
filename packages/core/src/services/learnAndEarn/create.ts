import { models } from '../../database';

export async function createLevel(title: string, userId: number) {
    const level = await models.learnAndEarnLevel.create({
        title,
        adminUserId: userId,
    });
    
    return level;
}