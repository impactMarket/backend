import { services } from '@impactmarket/core';
import { Request, Response } from 'express';
import { standardResponse } from '../../utils/api';

class MicrocreditController {
    microcreditService = new services.MicrocreditService();

    getGlobalData = async (req: Request, res: Response): Promise<void> => {
        this.microcreditService
            .getGlobalData()
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default MicrocreditController;