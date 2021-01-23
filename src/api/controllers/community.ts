import { Logger } from '@logger/logger';
import CommunityService from '@services/community';
import CommunityDailyMetricsService from '@services/communityDailyMetrics';
import ManagerService from '@services/managers';
import { Request, Response } from 'express';

import config from '../../config';

const controllerLogAndFail = (e: any, status: number, res: Response) => {
    Logger.error(e);
    res.status(status).send(e);
};

/**
 * @deprecated
 */
const findByContractAddress = (req: Request, res: Response) => {
    CommunityService.findByContractAddress(req.params.contractAddress)
        .then((community) => {
            if (community === null) {
                res.sendStatus(404);
            }
            res.send(community);
        })
        .catch((e) => controllerLogAndFail(e, 400, res));
};

/**
 * @deprecated
 */
const findByPublicId = (req: Request, res: Response) => {
    CommunityService.findByPublicId(req.params.publicId)
        .then((community) => {
            if (community === null) {
                res.sendStatus(404);
            }
            res.send(community);
        })
        .catch((e) => controllerLogAndFail(e, 400, res));
};

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

const getHistoricalSSI = (req: Request, res: Response) => {
    CommunityDailyMetricsService.getHistoricalSSI(req.params.publicId)
        .then((community) => {
            res.send(community);
        })
        .catch((e) => controllerLogAndFail(e, 400, res));
};

/**
 * @deprecated Since mobile version 0.1.0
 */
const getAll = (req: Request, res: Response) => {
    CommunityService.getAll(req.params.status)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const list = (req: Request, res: Response) => {
    CommunityService.list(req.params.order, req.query)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const listFull = (req: Request, res: Response) => {
    CommunityService.listFull(req.params.order)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const searchBeneficiary = (req: Request, res: Response) => {
    CommunityService.searchBeneficiary(
        (req as any).user.address,
        req.params.beneficiaryQuery,
        req.params.active === 'true'
    )
        .then((r) => res.send(r))
        .catch((e) => res.status(404).send(e));
};

const searchManager = (req: Request, res: Response) => {
    CommunityService.searchManager(
        (req as any).user.address,
        req.params.managerQuery
    )
        .then((r) => res.send(r))
        .catch((e) => res.status(404).send(e));
};

const listBeneficiaries = (req: Request, res: Response) => {
    CommunityService.listBeneficiaries(
        (req as any).user.address,
        req.params.active === 'true',
        parseInt(req.params.offset, 10),
        parseInt(req.params.limit, 10)
    )
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const listManagers = (req: Request, res: Response) => {
    CommunityService.listManagers(
        (req as any).user.address,
        parseInt(req.params.offset, 10),
        parseInt(req.params.limit, 10)
    )
        .then((r) => res.send(r))
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
        config.communityPlaceholderImageUrl,
        txReceipt,
        contractParams
    )
        .then((community) => res.status(201).send(community))
        .catch((e) => controllerLogAndFail(e, 403, res));
};

/**
 * @deprecated Since mobile version 0.1.8
 */
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
        gps,
        email,
        coverImage,
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
        coverImage,
        txReceipt,
        contractParams
    )
        .then((community) => res.status(201).send(community))
        .catch((e) => controllerLogAndFail(e, 403, res));
};

const edit = (req: Request, res: Response) => {
    const {
        publicId,
        name,
        description,
        language,
        currency,
        city,
        country,
        email,
        coverImage,
    } = req.body;
    // verify if the current user is manager in this community
    ManagerService.get((req as any).user)
        .then((manager) => {
            if (manager !== null && manager.communityId === publicId) {
                CommunityService.edit(
                    publicId,
                    name,
                    description,
                    language,
                    currency,
                    city,
                    country,
                    email,
                    coverImage
                )
                    .then((updateResult) =>
                        res.status(200).send(updateResult[1][0])
                    )
                    .catch((e) => controllerLogAndFail(e, 404, res));
            } else {
                Logger.warn(`Not admin of ${publicId}`);
                res.status(403).send(`Not admin of ${publicId}`);
            }
        })
        .catch((e) => controllerLogAndFail(e, 404, res));
};

const accept = (req: Request, res: Response) => {
    const {
        acceptanceTransaction, // the address accepting the request (must be admin)
        publicId,
    } = req.body;
    CommunityService.accept(acceptanceTransaction, publicId)
        .then((r) => res.send({ contractAddress: r }).status(202))
        .catch((e) => controllerLogAndFail(e, 403, res));
};

const pending = (req: Request, res: Response) => {
    CommunityService.pending()
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

export default {
    findByContractAddress,
    findByPublicId,
    getByPublicId,
    getByContractAddress,
    getHistoricalSSI,
    getAll,
    list,
    listFull,
    searchBeneficiary,
    searchManager,
    listBeneficiaries,
    listManagers,
    managers,
    managersDetails,
    create,
    add,
    edit,
    accept,
    pending,
};
