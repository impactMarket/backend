import { services } from '@impactmarket/core';
import { Request, Response } from 'express';

import { RequestWithUser } from '../../middlewares/core';
import { standardResponse } from '../../utils/api';

class ClaimLocationController {
    private claimLocationService: services.ubi.ClaimLocationServiceV2;
    constructor() {
        this.claimLocationService = new services.ubi.ClaimLocationServiceV2();
    }

    getAll = (req: Request, res: Response) => {
        this.claimLocationService.getAll()
            .then((r) => {
                res.send(r);
            })
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    add = (req: RequestWithUser, res: Response) => {
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

        this.claimLocationService.add(communityId, gps, req.user.address)
            .then(() => {
                res.sendStatus(200);
            })
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { ClaimLocationController };


