import { services } from '@impactmarket/core';
import { Request, Response } from 'express';
import { standardResponse } from '../../../utils/api';
import { RequestWithUser } from 'middlewares/core';

class ProtocolController {
    protocolService = new services.Protocol();

    getMicroCreditData = async (req: Request, res: Response): Promise<void> => {
        this.protocolService
            .getMicroCreditData()
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    saveForm = async (req: RequestWithUser, res: Response): Promise<void> => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        const form = req.body.form;
        const submit = req.body.submit;

        this.protocolService
            .saveForm(req.user.userId, form, !!submit)
            .then((community) => standardResponse(res, 201, true, community))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    }
}

export default ProtocolController;
