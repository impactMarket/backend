import { services } from '@impactmarket/core';
import { Response } from 'express';
import { RequestWithUser } from 'middlewares/core';

import { standardResponse } from '../../../utils/api';

class CommunityController {
    private communityService: services.ubi.CommunityListService;
    constructor() {
        this.communityService = new services.ubi.CommunityListService();
    }

    list = (req: RequestWithUser, res: Response) => {
        this.communityService
            .list(req.query, req.user?.address)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { CommunityController };
