import { NextFunction, Request } from 'express';
import { database } from '@impactmarket/core';

const { redisClient: redis } = database;

/**
 * Cache middleware
 * @param duration Duration is seconds
 * @returns void
 */
export const cache =
    (duration: number) =>
    // "res" needs to not have any type, otherwise, typescript will fail
    async (req: Request, res: any, next: NextFunction) => {
        const key = '__express__' + req.originalUrl || req.url;
        const cachedBody = await redis.get(key);
        if (cachedBody) {
            res.send(cachedBody);
        } else {
            res.sendResponse = res.send;
            res.send = (body: any) => {
                // Only cache if the response is 200
                if (res.statusCode === 200) {
                    redis.set(key, body, 'EX', duration);
                }
                res.sendResponse(body);
            };
            next();
        }
    };
