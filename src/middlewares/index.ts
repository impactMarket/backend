import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';

import config from '../config';
import Logger from '../loaders/logger';
import { RequestWithUser, UserInRequest } from '../types';

export function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Gather the jwt access token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        Logger.debug('User auth token is not valid!');
        res.sendStatus(401); // if there isn't any token
        return;
    }

    jwt.verify(token, config.jwtSecret, (err, _user) => {
        if (err) {
            Logger.debug(err.message);
            res.sendStatus(403);
            return;
        }
        const user = _user as UserInRequest;
        //
        (req as RequestWithUser).user = user;
        if (req.body !== undefined && req.body.address !== undefined) {
            if (req.body.address !== user.address) {
                Logger.debug('User token not valid for user address!');
                res.sendStatus(403);
                return;
            }
        }
        next(); // pass the execution off to whatever request the client intended
    });
}

export function generateAccessToken(userAddress: string): string {
    return jwt.sign(
        { address: userAddress, masterKey: config.masterKey } as UserInRequest,
        config.jwtSecret
    );
}
