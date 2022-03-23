import { services } from '@impactmarket/core';
import { Request, Response } from 'express';
import { RequestWithUser } from '../../../middlewares/core';

import { standardResponse } from '../../../utils/api';

class CommunityController {
    private detailsService: services.ubi.CommunityDetailsService;
    constructor() {
        this.detailsService = new services.ubi.CommunityDetailsService();
    }

    getManagers = (req: Request, res: Response) => {
        const { filterByActive } = req.query;
        let active: boolean | undefined;
        if (filterByActive === 'true') {
            active = true;
        } else if (filterByActive === 'false') {
            active = false;
        }

        this.detailsService
            .getManagers(parseInt(req.params.id, 10), active)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getBeneficiaries = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        let {
            active,
            offset,
            limit,
            suspect,
            inactivity,
            unidentified,
            blocked,
            loginInactivity,
            search
        } = req.query;
        if (active === undefined || typeof active !== 'string') {
            active = 'true';
        }
        if (offset === undefined || typeof offset !== 'string') {
            offset = '0';
        }
        if (limit === undefined || typeof limit !== 'string') {
            limit = '5';
        }
        this.detailsService.listBeneficiaries(
            req.user.address,
            parseInt(offset, 10),
            parseInt(limit, 10),
            {
                active: active === 'true',
                suspect: suspect ? suspect === 'true' : undefined,
                inactivity: inactivity === 'true',
                unidentified: unidentified ? unidentified === 'true' : undefined,
                blocked: blocked === 'true',
                loginInactivity: loginInactivity ? loginInactivity === 'true' : undefined,
            },
            search !== undefined && typeof(search) === 'string' ? search : undefined
        )
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) =>
                standardResponse(res, 400, false, '', { error: e })
            );
    };

    getBeneficiaryActivity = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        let { offset, limit, type } = req.query;
        if (offset === undefined || typeof offset !== 'string') {
            offset = '0';
        }
        if (limit === undefined || typeof limit !== 'string') {
            limit = '10';
        }
        if (type === undefined || typeof type !== 'string') {
            type = 'ALL';
        }

        services.ubi.BeneficiaryService.getBeneficiaryActivity(
            req.user.address,
            req.params.address,
            type,
            parseInt(offset, 10),
            parseInt(limit, 10)
        )
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { CommunityController };
