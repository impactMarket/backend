import jwt from 'jsonwebtoken';

import config from '../config';

export function generateAccessToken(userDetails: {
    userId: number;
    address: string;
    language: string;
    country: string;
    clientId?: number;
}): string {
    return jwt.sign(userDetails, config.jwtSecret);
}
