import { services } from '@impactmarket/core';
import { Request, Response } from 'express';

import { standardResponse } from '../../../utils/api';

class CommunityController {
    private stateService: services.ubi.CommunityStateService;
    constructor() {
        this.stateService = new services.ubi.CommunityStateService();
    }

    getState = (req: Request, res: Response) => {
        this.stateService
            .getState(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { CommunityController };
