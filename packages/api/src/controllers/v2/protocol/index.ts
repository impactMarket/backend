import { services } from '@impactmarket/core';
import { Request, Response } from 'express';
import { standardResponse } from '../../../utils/api';

class ProtocolController {
    protocolService = new services.Protocol();

    getMicroCreditData = async (req: Request, res: Response): Promise<void> => {
        this.protocolService
            .getMicroCreditData()
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default ProtocolController;
