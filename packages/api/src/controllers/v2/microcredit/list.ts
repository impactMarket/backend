import { services } from '@impactmarket/core';
import { Response } from 'express';

import { standardResponse } from '../../../utils/api';
import { ListBorrowersRequestSchema, RepaymentHistoryRequestSchema } from '../../../validators/microcredit';
import { ValidatedRequest } from '../../../utils/queryValidator';
import { RequestWithUser } from '../../../middlewares/core';

class MicroCreditController {
    private microCreditService: services.MicroCredit.List;
    constructor() {
        this.microCreditService = new services.MicroCredit.List();
    }

    // list borrowers using a loan manager account
    listBorrowers = (
        req: RequestWithUser & ValidatedRequest<ListBorrowersRequestSchema>,
        res: Response
    ) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.microCreditService
            .listBorrowers({ ...req.query, addedBy: req.user.address })
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    // list borrowers using a loan manager account
    getRepaymentsHistory = (
        req: RequestWithUser & ValidatedRequest<RepaymentHistoryRequestSchema>,
        res: Response
    ) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.microCreditService
            .getRepaymentsHistory(req.query)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { MicroCreditController };
