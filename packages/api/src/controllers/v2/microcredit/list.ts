import { Response } from 'express';
import { services } from '@impactmarket/core';

import {
    GetBorrowerRequestSchema,
    ListApplicationsRequestSchema,
    ListBorrowersRequestSchema,
    RepaymentHistoryRequestSchema
} from '~validators/microcredit';
import { RequestWithUser } from '~middlewares/core';
import { ValidatedRequest } from '~utils/queryValidator';
import { standardResponse } from '~utils/api';
import config from '~config/index';

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

        if (req.query.loanManagerAddress) {
            if (!config.admin.authorisedAddresses.includes(req.user.address)) {
                standardResponse(res, 400, false, '', {
                    error: {
                        name: 'USER_NOT_AUTHORIZED',
                        message: 'User not authorized!'
                    }
                });
                return;
            }
        }

        this.microCreditService
            .listBorrowers({ ...req.query, addedBy: req.query.loanManagerAddress ?? req.user.address })
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
            .listApplications(req.user.userId, req.query)
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
            .getBorrower({
                ...req.query,
                include: req.query.include instanceof Array ? req.query.include : [req.query.include]
            })
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

        this.microCreditService
            .getUserForm(req.user, parseInt(req.params.id as string, 10))
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getLoanManagersByCountry = (req: RequestWithUser, res: Response) => {
        const country = req.params.country as string;

        this.microCreditService
            .getLoanManagersByCountry(country)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { MicroCreditController };
