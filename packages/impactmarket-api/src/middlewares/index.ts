import { RequestWithUser, UserInRequest } from '../middlewares/core';
import { Response, NextFunction, Request } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import redisStore from 'rate-limit-redis';

import { config, database } from '@impactmarket/core';

export function authenticateToken(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
): void {
    // Gather the jwt access token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        if ((req as any).authTokenIsOptional) {
            next();
            return;
        }
        res.sendStatus(401); // if there isn't any token
        return;
    }

    jwt.verify(token, config.jwtSecret, (err, _user) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        if (_user === undefined) {
            res.sendStatus(403);
            return;
        }
        const user = _user as UserInRequest;
        req.user = user;
        //
        if (req.body !== undefined && req.body.address !== undefined) {
            if (req.body.address !== user.address) {
                res.sendStatus(403);
                return;
            }
        }
        next(); // pass the execution off to whatever request the client intended
    });
}

export function optionalAuthentication(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
): void {
    req['authTokenIsOptional'] = true;
    authenticateToken(req, res, next);
}

export function adminAuthentication(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Gather the jwt access token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        res.sendStatus(401); // if there isn't any token
        return;
    }

    jwt.verify(token, config.jwtSecret, (err, _admin) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        const admin = _admin as { key: string };
        //
        if (config.adminKey !== admin.key) {
            res.sendStatus(403);
            return;
        }
        next(); // pass the execution off to whatever request the client intended
    });
}

export const rateLimiter = rateLimit({
    max: config.maxRequestPerUser,
    message: `You have exceeded the ${config.maxRequestPerUser} requests in 15 minutes limit!`,
    headers: true,
    ...(process.env.NODE_ENV === 'test'
        ? {
              windowMs: 900000, // 15 minutes in milliseconds
          }
        : {
              store: new redisStore({
                  client: database.redisClient,
                  expiry: 900, // 15 minutes in seconds
              }),
          }),
});
