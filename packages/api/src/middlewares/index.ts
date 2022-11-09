import { config, database } from '@impactmarket/core';
import { ethers } from 'ethers';
import { Response, NextFunction, Request } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import redisStore from 'rate-limit-redis';

import { RequestWithUser, UserInRequest } from './core';

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

    jwt.verify(token, config.jwtSecret, async (err, _user) => {
        if (err) {
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

    if (address.toLocaleLowerCase() === req.user?.address.toLocaleLowerCase()) {
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
        if (parseInt(timestamp[0]) < expirationDate.getTime()) {
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
