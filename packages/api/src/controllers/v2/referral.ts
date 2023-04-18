import { Request, Response } from 'express';

export default class ReferralController {
    get = async (req: Request, res: Response): Promise<void> => {
        // TODO: get user referral data
    };

    post = async (req: Request, res: Response): Promise<void> => {
        // TODO: validate code
        // TODO: validate signature
        // TODO: validate user
        // TODO: send PACTs and notify both users
    };
}
