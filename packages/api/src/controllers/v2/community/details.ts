import { getAddress } from '@ethersproject/address';
import { services } from '@impactmarket/core';
import { Request, Response } from 'express';

import { RequestWithUser } from '../../../middlewares/core';
import { standardResponse } from '../../../utils/api';

class CommunityController {
    private detailsService: services.ubi.CommunityDetailsService;
    private claimLocationService: services.ubi.ClaimLocationServiceV2;
    constructor() {
        this.detailsService = new services.ubi.CommunityDetailsService();
        this.claimLocationService = new services.ubi.ClaimLocationServiceV2();
    }

    getManagers = (req: RequestWithUser, res: Response) => {
        const community = req.params.id;
        let { state, offset, limit, search, orderBy } = req.query;
        if (state === undefined || typeof state !== 'string') {
            state = undefined;
        }
        if (offset === undefined || typeof offset !== 'string') {
            offset = '0';
        }
        if (limit === undefined || typeof limit !== 'string') {
            limit = '5';
        }
        if (orderBy === undefined || typeof orderBy !== 'string') {
            orderBy = undefined;
        }

        this.detailsService
            .listManagers(
                parseInt(community, 10),
                parseInt(offset, 10),
                parseInt(limit, 10),
                {
                    state,
                },
                search !== undefined && typeof search === 'string'
                    ? search
                    : undefined,
                orderBy,
                req.user?.address
            )
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
            orderBy,
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
        if (orderBy === undefined || typeof orderBy !== 'string') {
            orderBy = undefined;
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
                    : undefined,
                orderBy
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
        const { groupBy, status, excludeCountry, ambassadorAddress } =
            req.query;
        if (groupBy === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'INVALID_GROUP',
                    message: 'not a valid group by',
                },
            });
            return;
        }
        this.detailsService
            .count(
                groupBy as string,
                status as string,
                excludeCountry as string,
                ambassadorAddress as string
            )
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getContract = (req: Request, res: Response) => {
        this.detailsService
            .getContract(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getAmbassador = (req: RequestWithUser, res: Response) => {
        this.detailsService
            .getAmbassador(parseInt(req.params.id, 10), req.user?.address)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getClaimLocation = (req: Request, res: Response) => {
        this.claimLocationService
            .getByCommunity(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getPresignedUrlMedia = (req: Request, res: Response) => {
        this.detailsService
            .getPresignedUrlMedia(req.params.mime)
            .then((url) => standardResponse(res, 200, true, url))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getPromoter = (req: Request, res: Response) => {
        this.detailsService
            .getPromoter(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    addBeneficiaries = (req: RequestWithUser, res: Response) => {
        const file = req.file;
        if (!file) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'INVALID_FILE',
                    message: 'file is invalid',
                },
            });
            return;
        }
        this.detailsService
            .addBeneficiaries(file)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { CommunityController };
