import { redisClient } from '../database';

export const cleanUserRolesCache = async (userAddress: string) => {
    const cachedBody = await redisClient.keys(`account-roles-${userAddress.toLowerCase()}`);
    cachedBody.forEach(key => {
        redisClient.del(key);
    });
};

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

export const cleanLearnAndEarnCache = async (userId?: number) => {
    const cachedBody = await redisClient.keys('__express__/api/v2/learn-and-earn*' + (userId ?? `user${userId}`));
    cachedBody.forEach(key => {
        redisClient.del(key);
    });
};

export const cleanMicroCreditBorrowersCache = async (userId?: number) => {
    const cachedBody = await redisClient.keys(
        '__express__/api/v2/microcredit/borrowers*' + (userId ?? `user${userId}`)
    );
    cachedBody.forEach(key => {
        redisClient.del(key);
    });
};

export const cleanMicroCreditApplicationsCache = async (userId?: number) => {
    const cachedBody = await redisClient.keys(
        '__express__/api/v2/microcredit/applications*' + (userId ?? `user${userId}`)
    );
    cachedBody.forEach(key => {
        redisClient.del(key);
    });
};

export const cleanMicroreditBorrowerCache = async (borrowerAddress: string) => {
    const cachedBody = await redisClient.keys(
        '__express__/api/v2/microcredit/borrower*address=' + borrowerAddress + '*'
    );
    cachedBody.forEach(key => {
        redisClient.del(key);
    });
};
