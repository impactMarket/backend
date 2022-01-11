import { RequestWithUser } from '../middlewares/core';
import { utils, services } from 'impactmarket-core';
import { Request, Response } from 'express';
import { standardResponse } from '../utils/api';

class CommunityController {
    findRequestChangeUbiParams = (req: Request, res: Response) => {
        services.ubi.CommunityService.findResquestChangeUbiParams(
            parseInt(req.params.id, 10)
        )
            .then((community) => standardResponse(res, 200, true, community))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    findByContractAddress = (req: RequestWithUser, res: Response) => {
        services.ubi.CommunityService.findByContractAddress(
            req.params.address,
            req.user?.address
        )
            .then((community) =>
                standardResponse(res, 200, !!community, community)
            )
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getPastSSI = (req: Request, res: Response) => {
        services.ubi.CommunityDailyMetricsService.getHistoricalSSI(
            parseInt(req.params.id, 10)
        )
            .then((ssi) => standardResponse(res, 200, true, ssi))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    list = (req: Request, res: Response) => {
        services.ubi.CommunityService.list(req.query)
            .then((r) =>
                standardResponse(res, 200, true, r.rows, { count: r.count })
            )
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
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
        services.ubi.CommunityService.count(groupBy as string)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    beneficiaries = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        if (req.query.action === 'search') {
            const {
                active,
                search,
                suspect,
                inactivity,
                unidentified,
                blocked,
            } = req.query;
            if (search === undefined || typeof search !== 'string') {
                throw new Error('invalid search!');
            }

            services.ubi.BeneficiaryService.search(req.user.address, search, {
                active: active !== undefined ? active === 'true' : undefined,
                suspect: suspect === 'true',
                inactivity: inactivity === 'true',
                unidentified: unidentified === 'true',
                blocked: blocked === 'true',
            })
                .then((r) => standardResponse(res, 200, true, r))
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        } else {
            let {
                active,
                offset,
                limit,
                suspect,
                inactivity,
                unidentified,
                blocked,
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
            services.ubi.BeneficiaryService.list(
                req.user.address,
                parseInt(offset, 10),
                parseInt(limit, 10),
                {
                    active: active === 'true',
                    suspect: suspect === 'true',
                    inactivity: inactivity === 'true',
                    unidentified: unidentified === 'true',
                    blocked: blocked === 'true',
                }
            )
                .then((r) => standardResponse(res, 200, true, r))
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        }
    };

    getPresignedUrlMedia = (req: Request, res: Response) => {
        services.ubi.CommunityService.getPresignedUrlMedia(
            req.params.mime,
            req.params.isPromoter === 'true'
        )
            .then((url) => standardResponse(res, 200, true, url))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    findById = (req: RequestWithUser, res: Response) => {
        services.ubi.CommunityService.findById(
            parseInt(req.params.id, 10),
            req.user?.address
        )
            .then((community) => standardResponse(res, 200, true, community))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getDashboard = (req: Request, res: Response) => {
        services.ubi.CommunityService.getDashboard(req.params.id)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getClaimLocation = (req: Request, res: Response) => {
        services.ubi.ClaimLocationService.getByCommunity(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getDemographics = (req: Request, res: Response) => {
        services.ubi.CommunityService.getDemographics(req.params.id)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getManagers = (req: Request, res: Response) => {
        const { filterByActive } = req.query;
        let active: boolean | undefined;
        if (filterByActive === 'true') {
            active = true;
        } else if (filterByActive === 'false') {
            active = false;
        }

        services.ubi.CommunityService.getManagers(parseInt(req.params.id, 10), active)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getPromoter = (req: Request, res: Response) => {
        services.ubi.CommunityService.getPromoter(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getSuspect = (req: Request, res: Response) => {
        services.ubi.CommunityService.getSuspect(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getContract = (req: Request, res: Response) => {
        services.ubi.CommunityService.getContract(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getState = (req: Request, res: Response) => {
        services.ubi.CommunityService.getState(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getMetrics = (req: Request, res: Response) => {
        services.ubi.CommunityService.getMetrics(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getCampaign = (req: Request, res: Response) => {
        services.ubi.CommunityService.getCampaign(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    create = (req: Request, res: Response) => {
        const {
            requestByAddress, // the address making the request (will be community manager)
            name,
            contractAddress,
            description,
            language,
            currency,
            city,
            country,
            coverMediaId,
            gps,
            email,
            txReceipt,
            contractParams,
        } = req.body;

        services.ubi.CommunityService.create({
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
            coverMediaId,
        })
            .then((community) => standardResponse(res, 201, true, community))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    edit = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { name, description, currency, coverMediaId, email } = req.body;
        // verify if the current user is manager in this community
        services.ubi.ManagerService.get(req.user.address)
            .then(async (manager) => {
                if (manager !== null) {
                    services.ubi.CommunityService.edit(
                        manager.id,
                        {
                            name,
                            description,
                            currency,
                            coverMediaId,
                            email,
                        },
                        req.user?.address
                    )
                        .then((community) =>
                            standardResponse(res, 200, true, community)
                        )
                        .catch((e) =>
                            standardResponse(res, 400, false, '', { error: e })
                        );
                } else {
                    standardResponse(res, 403, false, '', {
                        error: {
                            name: 'NOT_MANAGER',
                            message: 'Not manager!',
                        },
                    });
                }
            })
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    // admin methods

    accept = (req: Request, res: Response) => {
        const { acceptanceTransaction, publicId } = req.body;
        services.ubi.CommunityService.accept(acceptanceTransaction, publicId)
            .then((r) =>
                standardResponse(res, 201, true, { contractAddress: r })
            )
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    delete = (req: Request, res: Response) => {
        const { id } = req.params;
        services.ubi.CommunityService.delete(parseInt(id, 10))
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    deleteSubmission = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        services.ubi.CommunityService.deleteSubmission(req.user.address)
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    pending = (req: Request, res: Response) => {
        services.ubi.CommunityService.pending()
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
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

    editSubmission = (req: RequestWithUser, res: Response) => {
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
            coverMediaId,
            gps,
            email,
            contractParams,
        } = req.body;

        services.ubi.CommunityService.editSubmission({
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
            coverMediaId: parseInt(coverMediaId, 10),
        })
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

const getHistoricalSSI = (req: Request, res: Response) => {
    services.ubi.CommunityDailyMetricsService.getHistoricalSSI(parseInt(req.params.id, 10))
        .then((community) => {
            res.send(community);
        })
        .catch((e) => utils.api.controllerLogAndFail(e, 400, res));
};

const listLight = (req: Request, res: Response) => {
    services.ubi.CommunityService.listLight(req.params.order, req.query)
        .then((r) => res.send(r))
        .catch((e) => utils.api.controllerLogAndFail(e, 400, res));
};

const listFull = (req: Request, res: Response) => {
    services.ubi.CommunityService.listFull(req.params.order)
        .then((r) => res.send(r))
        .catch((e) => utils.api.controllerLogAndFail(e, 400, res));
};

const searchManager = (req: RequestWithUser, res: Response) => {
    if (req.user === undefined) {
        utils.api.controllerLogAndFail('User not identified!', 400, res);
        return;
    }
    services.ubi.CommunityService.searchManager(req.user.address, req.params.managerQuery)
        .then((r) => res.send(r))
        .catch((e) => res.status(404).send(e));
};

const listManagers = (req: RequestWithUser, res: Response) => {
    if (req.user === undefined) {
        utils.api.controllerLogAndFail('User not identified!', 400, res);
        return;
    }
    services.ubi.CommunityService.listManagers(
        req.user.address,
        parseInt(req.params.offset, 10),
        parseInt(req.params.limit, 10)
    )
        .then((r) => res.send(r))
        .catch((e) => utils.api.controllerLogAndFail(e, 400, res));
};

const accept = (req: Request, res: Response) => {
    const { acceptanceTransaction, publicId } = req.body;
    services.ubi.CommunityService.accept(acceptanceTransaction, publicId)
        .then((r) => res.send({ contractAddress: r }).status(202))
        .catch((e) => utils.api.controllerLogAndFail(e, 403, res));
};

const remove = (req: Request, res: Response) => {
    const { publicId } = req.body;
    services.ubi.CommunityService.remove(publicId)
        .then((r) => res.send(r).status(200))
        .catch((e) => utils.api.controllerLogAndFail(e, 403, res));
};

const pending = (req: Request, res: Response) => {
    services.ubi.CommunityService.pending()
        .then((r) => res.send(r))
        .catch((e) => utils.api.controllerLogAndFail(e, 400, res));
};

export default {
    getHistoricalSSI,
    listLight,
    listFull,
    searchManager,
    listManagers,
    accept,
    remove,
    pending,
    CommunityController,
};
