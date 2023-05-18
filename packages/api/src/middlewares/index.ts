import { config, database, subgraph } from '@impactmarket/core';
import { ethers } from 'ethers';
import { Response, NextFunction, Request } from 'express';
import rateLimit from 'express-rate-limit';
import { verify } from 'jsonwebtoken';
import RedisStore from 'rate-limit-redis';

import { RequestWithUser, UserInRequest } from './core';

const { getUserRoles } = subgraph.queries.user;
const { redisClient } = database;

export function authenticateToken(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
): void {
    // Gather the jwt access token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token === null || token === undefined) {
        if ((req as any).authTokenIsOptional) {
            next();
            return;
        }
        res.sendStatus(401); // if there isn't any token
        return;
    }

    verify(token, config.jwtSecret, async (err, _user) => {
        // prevent error when token is not valid and _user undefined or string
        if (err || typeof _user !== 'object') {
            res.sendStatus(403);
            return;
        }
        if (_user === undefined) {
            res.sendStatus(403);
            return;
        }

        if (_user.clientId) {
            // validate external token
            const credential =
                await database.models.appClientCredential.findOne({
                    where: {
                        clientId: _user.clientId,
                        status: 'active',
                    },
                });
            if (credential && credential.roles) {
                let path = req.path.split('/')[1];
                if (!path) {
                    const baseUrl = req.baseUrl.split('/');
                    path = baseUrl[baseUrl.length - 1];
                }
                const authorization = checkRoles(
                    credential.roles,
                    path,
                    req.method
                );
                if (!authorization) {
                    res.send(`User has no permition to ${req.path}`).status(
                        403
                    );
                    return;
                }
            } else {
                res.sendStatus(403);
                return;
            }
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
    if (token === null || token === undefined) {
        res.sendStatus(401); // if there isn't any token
        return;
    }

    verify(token, config.jwtSecret, (err, _admin) => {
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
    // standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    // legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // windowMs: 900000, // 15 minutes in milliseconds
    ...(process.env.NODE_ENV === 'test'
        ? {}
        : {
              store: new RedisStore({
                  // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
                  sendCommand: (...args: string[]) => redisClient.call(...args),
              }),
          }),
});

export function verifySignature(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
): void {
    const { signature, message } = req.headers;

    if (!signature || !message) {
        res.status(401).json({
            success: false,
            error: {
                name: 'INVALID_SINATURE',
                message: 'signature is invalid',
            },
        });
        return;
    }

    const address = ethers.utils.verifyMessage(
        message as string,
        signature as string
    );

    if (address.toLowerCase() === req.user?.address.toLowerCase()) {
        // validate signature timestamp
        const timestamp = (message as string).match(/(\d+$)/);
        if (!timestamp || !timestamp[0]) {
            res.status(403).json({
                success: false,
                error: {
                    name: 'EXPIRED_SIGNATURE',
                    message: 'signature is expired',
                },
            });
            return;
        }
        const expirationDate = new Date();
        expirationDate.setDate(
            expirationDate.getDate() - config.signatureExpiration
        );
        if (parseInt(timestamp[0], 10) < expirationDate.getTime()) {
            res.status(403).json({
                success: false,
                error: {
                    name: 'EXPIRED_SIGNATURE',
                    message: 'signature is expired',
                },
            });
            return;
        }
        next();
    } else {
        res.status(403).json({
            success: false,
            error: {
                name: 'INVALID_SINATURE',
                message: 'signature is invalid',
            },
        });
    }
}

const checkRoles = (roles: string[], path: string, reqMethod: string) => {
    let authorizate = false;
    for (let i = 0; i < roles.length; i++) {
        const [service, method] = roles[i].split(':');
        if (service === path.replace('/', '')) {
            if (
                method === '*' ||
                (reqMethod === 'GET' && method === 'read') ||
                (reqMethod === 'DELETE' && method === 'delete') ||
                ((reqMethod === 'POST' ||
                    reqMethod === 'PUT' ||
                    reqMethod === 'PATCH') &&
                    method === 'write')
            ) {
                authorizate = true;
                break;
            }
        }
    }
    return authorizate;
};

export const onlyAuthorizedRoles = (authorisedRoles: string[]) => async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        res.status(403).json({
            success: false,
            error: {
                name: 'INVALID_SINATURE',
                message: 'signature is invalid',
            },
        });
        return;
    }

    // get user roles
    // this method already has cache
    const userRoles = await getUserRoles(req.user.address);

    // check if user has at least one of the required roles
    for (let i = 0; i < authorisedRoles.length; i++) {
        if (userRoles[authorisedRoles[i]]) {
            next();
            return;
        }
    }

    res.status(401).json({
        success: false,
        error: {
            name: 'NOT_AUTHORIZED',
            message: 'you are not authorized to perform this action',
        },
    });
    return;
};
