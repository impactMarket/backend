import { RequestWithUser } from '@ipcttypes/core';
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

const add = (req: RequestWithUser, res: Response) => {
    if (req.user === undefined) {
        standardResponse(res, 401, false, '', {
            error: {
                name: 'USER_NOT_FOUND',
                message: 'User not identified!',
            },
        });
        return;
    }
    const { communityId, gps } = req.body;

    ClaimLocationService.add(communityId, gps, req.user.address)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((e) => standardResponse(res, 400, false, '', { error: e }));
};

export default {
    getAll,
    add,
};
