import jwt from "jsonwebtoken";
import {
    Request,
    Response,
    NextFunction,
} from 'express';
import config from "../config";

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    // Gather the jwt access token from the request header
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) {
        // TODO: log
        res.sendStatus(401) // if there isn't any token
        return;
    }

    jwt.verify(token, config.jwtSecret, (err, user) => {
        if (err) {
            // TODO: log
            res.sendStatus(403)
            return;
        }
        //
        (req as any).user = user
        next() // pass the execution off to whatever request the client intended
    })
}

export function generateAccessToken(userAddress: string): string {
    return jwt.sign(userAddress, config.jwtSecret);
}