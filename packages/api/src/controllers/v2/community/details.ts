import { getAddress } from '@ethersproject/address';
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
            state,
            offset,
            limit,
            suspect,
            inactivity,
            unidentified,
            loginInactivity,
            search,
        } = req.query;
        if (state === undefined || typeof state !== 'string') {
            state = undefined;
        }
        if (offset === undefined || typeof offset !== 'string') {
            offset = '0';
        }
        if (limit === undefined || typeof limit !== 'string') {
            limit = '5';
        }
        this.detailsService
            .listBeneficiaries(
                req.user.address,
                parseInt(offset, 10),
                parseInt(limit, 10),
                {
                    state,
                    suspect: suspect ? suspect === 'true' : undefined,
                    inactivity: inactivity ? inactivity === 'true' : undefined,
                    unidentified: unidentified
                        ? unidentified === 'true'
                        : undefined,
                    loginInactivity: loginInactivity
                        ? loginInactivity === 'true'
                        : undefined,
                },
                search !== undefined && typeof search === 'string'
                    ? search
                    : undefined
            )
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    findBy = (req: RequestWithUser, res: Response) => {
        const { idOrAddress } = req.params;
        if (idOrAddress.startsWith('0x')) {
            this.detailsService
                .findByContractAddress(
                    getAddress(idOrAddress),
                    req.user?.address
                )
                .then((community) =>
                    standardResponse(res, 200, !!community, community)
                )
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        } else {
            this.detailsService
                .findById(parseInt(idOrAddress, 10), req.user?.address)
                .then((community) =>
                    standardResponse(res, 200, true, community)
                )
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        }
    };

    count = (req: Request, res: Response) => {
        const { groupBy } = req.query;
        if (groupBy === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'INVALID_GROUP',
                    message: 'not a valid group by',
                },
            });
            return;
        }
        services.ubi.CommunityDetailsService.count(groupBy as string)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getContract = (req: Request, res: Response) => {
        this.detailsService.getUBIParams(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { CommunityController };
