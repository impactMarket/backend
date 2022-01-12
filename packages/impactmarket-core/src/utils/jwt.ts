import jwt from 'jsonwebtoken';
import config from '../config';

export function generateAccessToken(
    userAddress: string,
    userId: number
): string {
    return jwt.sign(
        {
            userId,
            address: userAddress,
            masterKey: config.masterKey,
        },
        config.jwtSecret
    );
}
