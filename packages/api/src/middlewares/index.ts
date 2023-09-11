import { NextFunction, Response } from 'express';
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer';
import { database, subgraph } from '@impactmarket/core';
import { verify } from 'jsonwebtoken';
import { verifyMessage, verifyTypedData } from '@ethersproject/wallet';
import RedisStore from 'rate-limit-redis';
import rateLimit from 'express-rate-limit';

import { RequestWithUser, UserInRequest } from './core';
import config from '~config/index';

const { getUserRoles } = subgraph.queries.user;
const { redisClient } = database;

export function authenticateToken(req: RequestWithUser, res: Response, next: NextFunction): void {
    // Gather the jwt access token from the request header
    const authHeader = req.headers['authorization'];
    const clientIdHeader = req.headers['client-id'];
    const token = authHeader && authHeader.split(' ')[1];

    if (clientIdHeader) {
        req.clientId = parseInt(clientIdHeader as string, 10);
    }

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

export function optionalAuthentication(req: RequestWithUser, res: Response, next: NextFunction): void {
    req['authTokenIsOptional'] = true;
    authenticateToken(req, res, next);
}

export function adminAuthentication(req: RequestWithUser, res: Response, next: NextFunction): void {
    if (!req.hasValidTypedSignature) {
        res.status(401).json({
            success: false,
            error: {
                name: 'INVALID_SINATURE',
                message: 'signature is invalid'
            }
        });
        return;
    }

    if (!req.user?.address || !config.admin.authorisedAddresses.includes(req.user.address)) {
        res.status(403).json({
            success: false,
            error: {
                name: 'NOT_AUTHORIZED',
                message: 'you are not authorized to perform this action'
            }
        });
        return;
    }
    next();
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
                  sendCommand: (...args: string[]) => redisClient.call(...args)
              })
          })
});

export function verifySignature(req: RequestWithUser, res: Response, next: NextFunction): void {
    const { signature, message } = req.headers;

    if (!signature || !message) {
        res.status(401).json({
            success: false,
            error: {
                name: 'INVALID_SINATURE',
                message: 'signature or message not provided'
            }
        });
        return;
    }

    const address = verifyMessage(message as string, signature as string);

    if (address.toLowerCase() === req.user?.address.toLowerCase()) {
        // validate signature timestamp
        const timestamp = (message as string).match(/(\d+$)/);
        if (!timestamp || !timestamp[0]) {
            res.status(403).json({
                success: false,
                error: {
                    name: 'EXPIRED_SIGNATURE',
                    message: 'signature expiry not provided'
                }
            });
            return;
        }
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - config.signatureExpiration);
        if (parseInt(timestamp[0], 10) < expirationDate.getTime() / 1000) {
            res.status(403).json({
                success: false,
                error: {
                    name: 'EXPIRED_SIGNATURE',
                    message: 'signature is expired'
                }
            });
            return;
        }
        next();
    } else {
        res.status(403).json({
            success: false,
            error: {
                name: 'INVALID_SINATURE',
                message: 'invalid signer'
            }
        });
    }
}

export function verifyTypedSignature(req: RequestWithUser, res: Response, next: NextFunction): void {
    const { eip712signature, eip712value: rawEip712Value } = req.headers;
    const eip712Value = JSON.parse(rawEip712Value as string) as Record<string, any>;

    if (!eip712signature || !eip712Value) {
        res.status(401).json({
            success: false,
            error: {
                name: 'INVALID_SINATURE',
                message: 'signature headers missing'
            }
        });
        return;
    }

    // validate if signature has expired
    if (parseInt(eip712Value['expiry'] as string, 10) < Date.now() / 1000) {
        res.status(403).json({
            success: false,
            error: {
                name: 'EXPIRED_SIGNATURE',
                message: 'signature is expired'
            }
        });
        return;
    }

    // same format as @impactmarket/utils
    const domain: TypedDataDomain = {
        chainId: config.chain.isMainnet ? 42220 : 44787,
        name: 'impactMarket',
        verifyingContract: config.DAOContractAddress,
        version: '1'
    };
    const types: Record<string, TypedDataField[]> = {
        Auth: [
            { name: 'message', type: 'string' },
            { name: 'expiry', type: 'uint256' }
        ]
    };

    // verify signature
    const address = verifyTypedData(domain, types, eip712Value, eip712signature as string);

    if (address.toLowerCase() === req.user?.address.toLowerCase()) {
        req.hasValidTypedSignature = true;
        next();
    } else {
        res.status(403).json({
            success: false,
            error: {
                name: 'INVALID_SINATURE',
                message: 'signature signer is invalid'
            }
        });
    }
}

export const onlyAuthorizedRoles =
    (authorisedRoles: string[]) => async (req: RequestWithUser, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(403).json({
                success: false,
                error: {
                    name: 'INVALID_SINATURE',
                    message: 'signature is invalid'
                }
            });
            return;
        }

        // when a user is request access to it's own data
        if (authorisedRoles.includes('itself')) {
            if (req.user.address.toLowerCase() === (req.query?.address as string | undefined)?.toLowerCase()) {
                next();
                return;
            }
            // maybe we need to add userId support as well
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
                message: 'you are not authorized to perform this action'
            }
        });
        return;
    };
