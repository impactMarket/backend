import { Response } from 'express';

import { ReferralRequestType } from '~validators/referral';
import { RequestWithUser } from '~middlewares/core';
import { getCampaignsIllegibility, getReferralCode, useReferralCode } from '~services/referral';
import { standardResponse } from '~utils/api';

export default class ReferralController {
    get = async (req: RequestWithUser, res: Response): Promise<void> => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        getCampaignsIllegibility(req.user.userId)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getByCampaign = async (req: RequestWithUser, res: Response): Promise<void> => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        getReferralCode(req.user.userId, parseInt(req.params.cid, 10))
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    post = async (req: RequestWithUser<any, any, ReferralRequestType>, res: Response): Promise<void> => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        useReferralCode(req.user.userId, req.body.code)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };
}
