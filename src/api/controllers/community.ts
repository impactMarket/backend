import { RequestWithUser } from '@ipcttypes/core';
import BeneficiaryService from '@services/ubi/beneficiary';
import CommunityService from '@services/ubi/community';
import CommunityDailyMetricsService from '@services/ubi/communityDailyMetrics';
import ManagerService from '@services/ubi/managers';
import { controllerLogAndFail, standardResponse } from '@utils/api';
import { Request, Response } from 'express';

class CommunityController {
    findRequestChangeUbiParams = (req: Request, res: Response) => {
        CommunityService.findResquestChangeUbiParams(
            parseInt(req.params.id, 10)
        )
            .then((community) => standardResponse(res, 200, true, community))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    findByContractAddress = (req: Request, res: Response) => {
        CommunityService.findByContractAddress(req.params.address)
            .then((community) =>
                standardResponse(res, 200, !!community, community)
            )
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getPastSSI = (req: Request, res: Response) => {
        CommunityDailyMetricsService.getHistoricalSSI(
            parseInt(req.params.id, 10)
        )
            .then((ssi) => standardResponse(res, 200, true, ssi))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    list = (req: Request, res: Response) => {
        CommunityService.list(req.query)
            .then((r) =>
                standardResponse(res, 200, true, r.rows, { count: r.count })
            )
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    beneficiaries = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 400, false, '', {
                error: 'User not identified!',
            });
            return;
        }
        if (req.query.action === 'search') {
            const { active, search } = req.query;
            if (search === undefined || typeof search !== 'string') {
                throw new Error('invalid search!');
            }
            CommunityService.searchBeneficiary(
                req.user.address,
                search,
                active !== undefined ? active === 'true' : undefined
            )
                .then((r) => standardResponse(res, 200, true, r))
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        } else {
            let { active, offset, limit } = req.query;
            if (active === undefined || typeof active !== 'string') {
                active = 'true';
            }
            if (offset === undefined || typeof offset !== 'string') {
                offset = '0';
            }
            if (limit === undefined || typeof limit !== 'string') {
                limit = '5';
            }
            CommunityService.listBeneficiaries(
                req.user.address,
                active === 'true',
                parseInt(offset, 10),
                parseInt(limit, 10)
            )
                .then((r) => standardResponse(res, 200, true, r))
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        }
    };

    pictureAdd = (req: Request, res: Response) => {
        CommunityService.pictureAdd(req.params.isPromoter === 'true', req.file)
            .then((url) => standardResponse(res, 200, true, url))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    findById = (req: Request, res: Response) => {
        CommunityService.findById(parseInt(req.params.id, 10))
            .then((community) => standardResponse(res, 200, true, community))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getDashboard = (req: Request, res: Response) => {
        CommunityService.getDashboard(req.params.id)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getClaimLocation = (req: Request, res: Response) => {
        CommunityService.getClaimLocation(req.params.id)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getDemographics = (req: Request, res: Response) => {
        CommunityService.getDemographics(req.params.id)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getManagers = (req: Request, res: Response) => {
        CommunityService.getManagers(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getPromoter = (req: Request, res: Response) => {
        CommunityService.getPromoter(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getSuspect = (req: Request, res: Response) => {
        CommunityService.getSuspect(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getContract = (req: Request, res: Response) => {
        CommunityService.getContract(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getState = (req: Request, res: Response) => {
        CommunityService.getState(parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getMetrics = (req: Request, res: Response) => {
        CommunityService.getMetrics(parseInt(req.params.id, 10))
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

        CommunityService.create(
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
            coverMediaId
        )
            .then((community) => standardResponse(res, 201, true, community))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    edit = (req: RequestWithUser, res: Response) => {
        const {
            name,
            description,
            language,
            currency,
            city,
            country,
            email,
            coverMediaId,
        } = req.body;
        // verify if the current user is manager in this community
        ManagerService.get(req.user!.address)
            .then(async (manager) => {
                if (manager !== null) {
                    const community = await CommunityService.getByPublicId(
                        manager.communityId
                    );
                    CommunityService.edit(
                        community!.id,
                        name,
                        description,
                        language,
                        currency,
                        city,
                        country,
                        email,
                        coverMediaId
                    )
                        .then((community) =>
                            standardResponse(res, 200, true, community)
                        )
                        .catch((e) =>
                            standardResponse(res, 400, false, '', { error: e })
                        );
                } else {
                    standardResponse(res, 403, false, '', {
                        error: `Not manager!`,
                    });
                }
            })
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    // admin methods

    accept = (req: Request, res: Response) => {
        const { acceptanceTransaction, publicId } = req.body;
        CommunityService.accept(acceptanceTransaction, publicId)
            .then((r) =>
                standardResponse(res, 201, true, { contractAddress: r })
            )
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    delete = (req: Request, res: Response) => {
        const { id } = req.params;
        CommunityService.delete(parseInt(id, 10))
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    pending = (req: Request, res: Response) => {
        CommunityService.pending()
            .then((r) => standardResponse(res, 201, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

const getResquestChangeUbiParams = (req: Request, res: Response) => {
    CommunityService.getResquestChangeUbiParams(req.params.publicId)
        .then((community) => {
            // if it's null, doesn't exist, there's no request
            res.send(community);
        })
        .catch((e) => controllerLogAndFail(e, 400, res));
};

/**
 * @deprecated
 */
const getByPublicId = (req: Request, res: Response) => {
    CommunityService.getByPublicId(req.params.publicId)
        .then((community) => {
            if (community === null) {
                res.sendStatus(404);
            }
            res.send(community);
        })
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const getByContractAddress = (req: Request, res: Response) => {
    CommunityService.getByContractAddress(req.params.address)
        .then((community) => {
            if (community === null) {
                res.sendStatus(404);
            }
            res.send(community);
        })
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const getHistoricalSSIByPublicId = (req: Request, res: Response) => {
    CommunityDailyMetricsService.getHistoricalSSIByPublicId(req.params.publicId)
        .then((community) => {
            res.send(community);
        })
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const getHistoricalSSI = (req: Request, res: Response) => {
    CommunityDailyMetricsService.getHistoricalSSI(parseInt(req.params.id, 10))
        .then((community) => {
            res.send(community);
        })
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const list = (req: Request, res: Response) => {
    CommunityService.list(req.query)
        .then((r) =>
            standardResponse(res, 200, true, r.rows, { count: r.count })
        )
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const listLight = (req: Request, res: Response) => {
    CommunityService.listLight(req.params.order, req.query)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const listFull = (req: Request, res: Response) => {
    CommunityService.listFull(req.params.order)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const findBeneficiaryByAddress = (req: Request, res: Response) => {
    BeneficiaryService.findByAddress(req.params.address)
        .then((r) => res.send(r))
        .catch((e) => res.status(404).send(e));
};

const searchBeneficiary = (req: RequestWithUser, res: Response) => {
    if (req.user === undefined) {
        controllerLogAndFail('User not identified!', 400, res);
        return;
    }
    CommunityService.searchBeneficiary(
        req.user.address,
        req.params.beneficiaryQuery,
        req.params.active ? req.params.active === 'true' : undefined
    )
        .then((r) => res.send(r))
        .catch((e) => res.status(404).send(e));
};

const searchManager = (req: RequestWithUser, res: Response) => {
    if (req.user === undefined) {
        controllerLogAndFail('User not identified!', 400, res);
        return;
    }
    CommunityService.searchManager(req.user.address, req.params.managerQuery)
        .then((r) => res.send(r))
        .catch((e) => res.status(404).send(e));
};

const listBeneficiaries = (req: RequestWithUser, res: Response) => {
    if (req.user === undefined) {
        controllerLogAndFail('User not identified!', 400, res);
        return;
    }
    CommunityService.listBeneficiaries(
        req.user.address,
        req.params.active === 'true',
        parseInt(req.params.offset, 10),
        parseInt(req.params.limit, 10)
    )
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const listManagers = (req: RequestWithUser, res: Response) => {
    if (req.user === undefined) {
        controllerLogAndFail('User not identified!', 400, res);
        return;
    }
    CommunityService.listManagers(
        req.user.address,
        parseInt(req.params.offset, 10),
        parseInt(req.params.limit, 10)
    )
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const pictureAdd = (req: Request, res: Response) => {
    CommunityService.pictureAdd(req.params.isPromoter === 'true', req.file)
        .then((url) => standardResponse(res, 200, true, url))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const findById = (req: Request, res: Response) => {
    CommunityService.findById(parseInt(req.params.id, 10))
        .then((community) => standardResponse(res, 200, true, community))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const getDashboard = (req: Request, res: Response) => {
    CommunityService.getDashboard(req.params.id)
        .then((r) => standardResponse(res, 200, true, r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const getClaimLocation = (req: Request, res: Response) => {
    CommunityService.getClaimLocation(req.params.id)
        .then((r) => standardResponse(res, 200, true, r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const getManagers = (req: Request, res: Response) => {
    CommunityService.getManagers(parseInt(req.params.id, 10))
        .then((r) => standardResponse(res, 200, true, r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

/**
 * @deprecated Since mobile version 0.1.8
 */
const managers = (req: Request, res: Response) => {
    CommunityService.managers((req as any).user.address)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

/**
 * @deprecated Since mobile version 0.1.8
 */
const managersDetails = (req: Request, res: Response) => {
    CommunityService.managersDetails((req as any).user.address)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const create = (req: Request, res: Response) => {
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

    CommunityService.create(
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
        coverMediaId
    )
        .then((community) => standardResponse(res, 201, true, community))
        .catch((e) => standardResponse(res, 403, false, e));
};

/**
 * @deprecated
 */
const add = (req: Request, res: Response) => {
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
    } = req.body;

    CommunityService.create(
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
        contractParams
    )
        .then((community) => res.status(201).send(community))
        .catch((e) => controllerLogAndFail(e, 403, res));
};

const edit = (req: RequestWithUser, res: Response) => {
    const {
        name,
        description,
        language,
        currency,
        city,
        country,
        email,
        coverMediaId,
    } = req.body;
    // verify if the current user is manager in this community
    ManagerService.get(req.user!.address)
        .then(async (manager) => {
            if (manager !== null) {
                const community = await CommunityService.getByPublicId(
                    manager.communityId
                );
                CommunityService.edit(
                    community!.id,
                    name,
                    description,
                    language,
                    currency,
                    city,
                    country,
                    email,
                    coverMediaId
                )
                    .then((updateResult) =>
                        res.status(200).send(updateResult[1][0])
                    )
                    .catch((e) => controllerLogAndFail(e, 404, res));
            } else {
                res.status(403).send(`Not manager!`);
            }
        })
        .catch((e) => controllerLogAndFail(e, 404, res));
};

const accept = (req: Request, res: Response) => {
    const { acceptanceTransaction, publicId } = req.body;
    CommunityService.accept(acceptanceTransaction, publicId)
        .then((r) => res.send({ contractAddress: r }).status(202))
        .catch((e) => controllerLogAndFail(e, 403, res));
};

const remove = (req: Request, res: Response) => {
    const { publicId } = req.body;
    CommunityService.remove(publicId)
        .then((r) => res.send(r).status(200))
        .catch((e) => controllerLogAndFail(e, 403, res));
};

const pending = (req: Request, res: Response) => {
    CommunityService.pending()
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

export default {
    getResquestChangeUbiParams,
    getByPublicId,
    findById,
    pictureAdd,
    getByContractAddress,
    getHistoricalSSIByPublicId,
    getHistoricalSSI,
    getDashboard,
    getClaimLocation,
    getManagers,
    list,
    listLight,
    listFull,
    findBeneficiaryByAddress,
    searchBeneficiary,
    searchManager,
    listBeneficiaries,
    listManagers,
    managers,
    managersDetails,
    add,
    create,
    edit,
    accept,
    remove,
    pending,
    CommunityController,
};
