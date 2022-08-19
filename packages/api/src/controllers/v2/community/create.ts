import { services } from '@impactmarket/core';
import { Response, Request } from 'express';

import { RequestWithUser } from '../../../middlewares/core';
import { standardResponse } from '../../../utils/api';

class CommunityController {
    private communityService: services.ubi.CommunityCreateService;
    private communityDetailsService: services.ubi.CommunityDetailsService;
    constructor() {
        this.communityService = new services.ubi.CommunityCreateService();
        this.communityDetailsService =
            new services.ubi.CommunityDetailsService();
    }

    create = async (req: Request, res: Response) => {
        const {
            requestByAddress, // the address making the request (will be community manager)
            name,
            contractAddress,
            description,
            language,
            currency,
            city,
            country,
            gps,
            email,
            txReceipt,
            contractParams,
            coverMediaPath,
            placeId,
        } = req.body;

        this.communityService
            .create({
                requestByAddress,
                name,
                contractAddress,
                description,
                language,
                currency,
                city,
                country,
                gps,
                email,
                txReceipt,
                contractParams,
                coverMediaPath,
                placeId,
            })
            .then((community) => standardResponse(res, 201, true, community))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

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
            placeId,
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
                placeId,
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

    edit = async (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { name, description, coverMediaPath } = req.body;
        const { id } = req.params;

        this.communityService
            .edit(
                req.user.address,
                parseInt(id),
                {
                    name,
                    description,
                    coverMediaPath,
                },
                req.user?.userId
            )
            .then((community) =>
                standardResponse(res, 200, true, community)
            )
            .catch((e) =>
                standardResponse(res, 400, false, '', { error: e })
            );
    };
}

export { CommunityController };
