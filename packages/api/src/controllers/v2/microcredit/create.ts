import { services } from '@impactmarket/core';
import { Response } from 'express';

import { standardResponse } from '../../../utils/api';
import { PreSignerUrlFromAWSRequestSchema } from '../../../validators/microcredit';
import { ValidatedRequest } from '../../../utils/queryValidator';
import { RequestWithUser } from '../../../middlewares/core';

class MicroCreditController {
    private microCreditService: services.MicroCredit.Create;
    constructor() {
        this.microCreditService = new services.MicroCredit.Create();
    }

    getPresignedUrlMedia = (
        req: RequestWithUser & ValidatedRequest<PreSignerUrlFromAWSRequestSchema>,
        res: Response
    ) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        const { mime } = req.query;

        if (mime === undefined || !(typeof mime === 'string')) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'INVALID_QUERY',
                    message: 'missing mime'
                }
            });
            return;
        }

        this.microCreditService
            .getPresignedUrlMedia(mime)
            .then(r => standardResponse(res, 201, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { MicroCreditController };
