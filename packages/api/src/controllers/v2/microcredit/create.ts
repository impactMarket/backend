import { Response } from 'express';
import { services } from '@impactmarket/core';

import {
    PostDocsRequestType,
    PreSignerUrlFromAWSRequestSchema,
    PutApplicationsRequestType
} from '../../../validators/microcredit';
import { RequestWithUser } from '../../../middlewares/core';
import { ValidatedRequest } from '../../../utils/queryValidator';
import { standardResponse } from '../../../utils/api';

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
            .then(r => !req.timedout && standardResponse(res, 201, true, r))
            .catch(e => !req.timedout && standardResponse(res, 400, false, '', { error: e }));
    };

    postDocs = (req: RequestWithUser<any, any, PostDocsRequestType>, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        this.microCreditService
            .postDocs(req.user.userId, req.body)
            .then(r => standardResponse(res, 201, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    updateApplication = (req: RequestWithUser<any, any, PutApplicationsRequestType>, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        this.microCreditService
            .updateApplication(
                req.body.map(a => a.applicationId),
                req.body.map(a => a.status)
            )
            .then(r => standardResponse(res, 201, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    saveForm = async (req: RequestWithUser, res: Response): Promise<void> => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        const form = req.body.form;
        const { submit, prismicId, selectedLoanManagerId } = req.body;

        this.microCreditService
            .saveForm(req.user.userId, form, prismicId, selectedLoanManagerId, !!submit)
            .then(community => standardResponse(res, 201, true, community))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    addNote = async (req: RequestWithUser, res: Response): Promise<void> => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        const { userId, note } = req.body;

        this.microCreditService
            .addNote(req.user.userId, userId, note)
            .then(note => standardResponse(res, 201, true, note))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { MicroCreditController };
