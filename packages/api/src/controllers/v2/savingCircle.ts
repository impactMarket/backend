import { Response } from 'express';
import { services } from '@impactmarket/core';

import { RequestWithUser } from '../../middlewares/core';
import { standardResponse } from '../../utils/api';

class SavingCircleController {
    savingCircleService = new services.SavingCircleService();

    create = async (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }
        const { name, country, amount, frequency, firstDepositOn, members } = req.body;
        this.savingCircleService
            .create(req.user, { name, country, amount, frequency, firstDepositOn, members })
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default SavingCircleController;
