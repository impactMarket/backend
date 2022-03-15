import { services } from '@impactmarket/core';
import { Request, Response } from 'express';

import { standardResponse } from '../../../utils/api';

class CommunityController {
    private communityService: services.ubi.CommunityServiceV2;
    constructor() {
        this.communityService = new services.ubi.CommunityServiceV2();
    }

    list = (req: Request, res: Response) => {
        this.communityService
            .list(req.query)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { CommunityController };
