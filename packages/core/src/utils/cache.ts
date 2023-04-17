import { redisClient } from '../database';

export const cleanBeneficiaryCache = async (communityId: number) => {
    const cachedBody = await redisClient.keys(`__express__/api/v2/communities/${communityId}/beneficiaries*`);
    cachedBody.forEach(key => {
        redisClient.del(key);
    });
};

export const cleanStoryCache = async () => {
    const cachedBody = await redisClient.keys(`__express__/api/v2/stories*`);
    cachedBody.forEach(key => {
        redisClient.del(key);
    });
};