import { services } from '@impactmarket/core';
import { Response } from 'express';

import { standardResponse } from '../../../utils/api';
import {
    GetBorrowerRequestSchema,
    ListApplicationsRequestSchema,
    ListBorrowersRequestSchema,
    RepaymentHistoryRequestSchema
} from '../../../validators/microcredit';
import { ValidatedRequest } from '../../../utils/queryValidator';
import { RequestWithUser } from '../../../middlewares/core';

class MicroCreditController {
    private microCreditService: services.MicroCredit.List;
    constructor() {
        this.microCreditService = new services.MicroCredit.List();
    }

    // list borrowers using a loan manager account
    listBorrowers = (req: RequestWithUser & ValidatedRequest<ListBorrowersRequestSchema>, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }
        this.microCreditService
            .listBorrowers({ ...req.query, addedBy: req.user.address })
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    // list applications
    listApplications = (req: RequestWithUser & ValidatedRequest<ListApplicationsRequestSchema>, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }
        this.microCreditService
            .listApplications(req.query)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    // list borrowers using a loan manager account
    getRepaymentsHistory = (req: RequestWithUser & ValidatedRequest<RepaymentHistoryRequestSchema>, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }
        this.microCreditService
            .getRepaymentsHistory(req.query)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getBorrower = (req: RequestWithUser & ValidatedRequest<GetBorrowerRequestSchema>, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }
        this.microCreditService
            .getBorrower(req.query)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    demographics = (req: RequestWithUser, res: Response) => {
        this.microCreditService
            .demographics()
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getUserForm = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        const { userId, status } = req.query;

        this.microCreditService
            .getUserForm(
                parseInt(userId as string, 10),
                status as string | undefined
            )
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    }
}

export { MicroCreditController };
