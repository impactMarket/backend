import { Request, Response } from 'express';
import { getAddress } from '@ethersproject/address';
import { services } from '@impactmarket/core';

import { GetBeneficiariesRequestSchema, GetManagersRequestSchema } from '~validators/community';
import { RequestWithUser } from '../../../middlewares/core';
import { ValidatedRequest } from '~utils/queryValidator';
import { standardResponse } from '../../../utils/api';

class CommunityController {
    private detailsService: services.ubi.CommunityDetailsService;
    private claimLocationService: services.ubi.ClaimLocationServiceV2;
    constructor() {
        this.detailsService = new services.ubi.CommunityDetailsService();
        this.claimLocationService = new services.ubi.ClaimLocationServiceV2();
    }

    getManagers = (req: RequestWithUser & ValidatedRequest<GetManagersRequestSchema>, res: Response) => {
        const community = req.params.id;
        const { search, state, offset, limit, orderBy } = req.query;

        this.detailsService
            .listManagers(
                parseInt(community, 10),
                offset!,
                limit!,
                {
                    state
                },
                search !== undefined && typeof search === 'string' ? search : undefined,
                orderBy,
                req.user?.address
            )
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getBeneficiaries = (req: RequestWithUser & ValidatedRequest<GetBeneficiariesRequestSchema>, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }
        const { suspect, inactivity, unidentified, loginInactivity, search, lastActivity_lt } = req.query;
        const { state, offset, limit, orderBy } = req.query;
        this.detailsService
            .listBeneficiaries(
                req.user.address,
                parseInt(req.params.id, 10),
                offset!,
                limit!,
                {
                    state,
                    suspect,
                    inactivity,
                    unidentified,
                    loginInactivity
                },
                search !== undefined && typeof search === 'string' ? search : undefined,
                orderBy as string,
                lastActivity_lt
            )
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    findBy = (req: RequestWithUser, res: Response) => {
        const { idOrAddress } = req.params;
        if (typeof idOrAddress === 'number') {
            const communityId = parseInt(idOrAddress, 10);
            if (!communityId) {
                standardResponse(res, 400, false, '', {
                    error: {
                        name: 'INVALID_PARAMS',
                        message: 'community ID or address is expected'
                    }
                });
                return;
            }

            this.detailsService
                .findById(communityId, req.user?.address, req.query)
                .then(community => standardResponse(res, 200, true, community))
                .catch(e => standardResponse(res, 400, false, '', { error: e }));
        } else {
            this.detailsService
                .findByContractAddress(getAddress(idOrAddress), req.user?.address, req.query)
                .then(community => standardResponse(res, 200, !!community, community))
                .catch(e => standardResponse(res, 400, false, '', { error: e }));
        }
    };

    count = (req: Request, res: Response) => {
        const { groupBy, status, excludeCountry, ambassadorAddress } = req.query;
        if (groupBy === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'INVALID_GROUP',
                    message: 'not a valid group by'
                }
            });
            return;
        }
        this.detailsService
            .count(groupBy as string, status as string, excludeCountry as string, ambassadorAddress as string)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getContract = (req: Request, res: Response) => {
        this.detailsService
            .getContract(parseInt(req.params.id, 10))
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getAmbassador = (req: RequestWithUser, res: Response) => {
        this.detailsService
            .getAmbassador(parseInt(req.params.id, 10), req.user?.address)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getMerchant = (req: Request, res: Response) => {
        this.detailsService
            .getMerchant(parseInt(req.params.id, 10))
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getClaimLocation = (req: Request, res: Response) => {
        this.claimLocationService
            .getByCommunity(parseInt(req.params.id, 10))
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getPresignedUrlMedia = (req: Request, res: Response) => {
        this.detailsService
            .getPresignedUrlMedia(req.params.mime)
            .then(url => standardResponse(res, 200, true, url))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getPromoter = (req: Request, res: Response) => {
        this.detailsService
            .getPromoter(parseInt(req.params.id, 10))
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    addBeneficiaries = (req: RequestWithUser, res: Response) => {
        const file = req['file'];

        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        if (!file) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'INVALID_FILE',
                    message: 'file is invalid'
                }
            });
            return;
        }
        this.detailsService
            .addBeneficiaries(file, req.user.address)
            .then(r => {
                if (r.success) {
                    standardResponse(res, 200, true, r);
                } else {
                    res.status(400).sendFile(r.fileName!, {
                        root: r.filePath
                    });
                }
            })
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    getCampaign = (req: Request, res: Response) => {
        this.detailsService
            .getCampaign(parseInt(req.params.id, 10))
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { CommunityController };
