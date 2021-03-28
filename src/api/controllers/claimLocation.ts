import ClaimLocationService from '@services/ubi/claimLocation';
import { controllerLogAndFail } from '@utils/api';
import { Request, Response } from 'express';

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
