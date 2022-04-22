import { services } from '@impactmarket/core';
import { Response, Request } from 'express';

import { standardResponse } from '../../../utils/api';

class CommunityController {
    private communityService: services.ubi.CommunityListService;
    constructor() {
        this.communityService = new services.ubi.CommunityListService();
    }

    list = (req: Request, res: Response) => {
        this.communityService
            .list(req.query)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { CommunityController };
