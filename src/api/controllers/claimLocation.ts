import ClaimLocationService from '@services/ubi/claimLocation';
import { standardResponse } from '@utils/api';
import { Request, Response } from 'express';

const getAll = (req: Request, res: Response) => {
    ClaimLocationService.getAll()
        .then((r) => {
            res.send(r);
        })
        .catch((e) => standardResponse(res, 400, false, '', { error: e }));
};

const add = (req: Request, res: Response) => {
    const { communityId, gps } = req.body;
    // TODO: IPCT1-345
    ClaimLocationService.add(communityId, gps)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((e) => standardResponse(res, 400, false, '', { error: e }));
};

export default {
    getAll,
    add,
};
