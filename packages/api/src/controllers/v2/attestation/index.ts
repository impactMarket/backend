import { Response } from 'express';

import { AttestationRequestType } from '../../../validators/attestation';
import { RequestWithUser } from '../../../middlewares/core';
import { send, verify } from '../../../services/attestation';
import { standardResponse } from '../../../utils/api';

export const attestation = (req: RequestWithUser<never, never, AttestationRequestType>, res: Response) => {
    if (req.user === undefined) {
        standardResponse(res, 401, false, '', {
            error: {
                name: 'USER_NOT_FOUND',
                message: 'User not identified!'
            }
        });
        return;
    }

    const { plainTextIdentifier, code, type, service } = req.body;

    if (service === 'verify') {
        verify(plainTextIdentifier, type, code!, req.user.userId)
            .then(r => standardResponse(res, 200, true, r, {}))
            .catch(e => standardResponse(res, 400, false, '', { error: e.message }));
    } else if (service === 'send') {
        send(plainTextIdentifier, type, req.user.userId)
            .then(r => standardResponse(res, 200, true, r, {}))
            .catch(e => standardResponse(res, 400, false, '', { error: e.message }));
    }
};
