import ClaimLocationService from '@services/claimLocation';
import { Logger } from '@utils/logger';
import { Request, Response } from 'express';

const controllerLogAndFail = (e: any, status: number, res: Response) => {
    Logger.error(e);
    res.status(status).send(e);
};

const getAll = (req: Request, res: Response) => {
    ClaimLocationService.getAll()
        .then((r) => {
            res.send(r);
        })
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const add = (req: Request, res: Response) => {
    const { communityId, gps } = req.body;
    ClaimLocationService.add(communityId, gps)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((e) => controllerLogAndFail(e, 400, res));
};

export default {
    getAll,
    add,
};
