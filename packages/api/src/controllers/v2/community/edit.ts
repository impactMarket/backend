import { services } from '@impactmarket/core';
import { Response } from 'express';

import { RequestWithUser } from '../../../middlewares/core';
import { standardResponse } from '../../../utils/api';

class CommunityController {
    private communityService: services.ubi.CommunityEditService;
    constructor() {
        this.communityService = new services.ubi.CommunityEditService();
    }

    editSubmission = async (req: RequestWithUser, res: Response) => {
        const { id } = req.params;

        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        const {
            name,
            description,
            language,
            currency,
            city,
            country,
            coverMediaPath,
            gps,
            email,
            contractParams,
        } = req.body;

        this.communityService
            .editSubmission(parseInt(id), {
                requestByAddress: req.user.address,
                name,
                description,
                language,
                currency,
                city,
                country,
                gps,
                email,
                contractParams,
                coverMediaPath,
            })
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    review = async (req: RequestWithUser, res: Response) => {
        const { review } = req.body;
        const { id } = req.params;

        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        this.communityService
            .review(parseInt(id), review, req.user.address)
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { CommunityController };
