import { Request, Response } from 'express';
import CommunityService from '../services/community';
import { Logger } from '../loaders/logger';
import ManagerService from '../services/managers';
import CommunityDailyMetricsService from '../services/communityDailyMetrics';

const controllerLogAndFail = (e: any, status: number, res: Response) => {
    Logger.error(e);
    res.status(status).send(e);
}

const findByContractAddress = (req: Request, res: Response) => {
    CommunityService.findByContractAddress(
        req.params.contractAddress
    ).then((community) => {
        if (community === null) {
            res.sendStatus(404);
        }
        res.send(community);
    }).catch((e) => controllerLogAndFail(e, 500, res));
}

/**
 * @deprecated
 */
const findByPublicId = (req: Request, res: Response) => {
    CommunityService.findByPublicId(
        req.params.publicId
    ).then((community) => {
        if (community === null) {
            res.sendStatus(404);
        }
        res.send(community);
    }).catch((e) => controllerLogAndFail(e, 500, res));
}

const get = (req: Request, res: Response) => {
    CommunityService.get(
        req.params.publicId
    ).then((community) => {
        if (community === null) {
            res.sendStatus(404);
        }
        res.send(community);
    }).catch((e) => controllerLogAndFail(e, 500, res));
}

const getHistoricalSSI = (req: Request, res: Response) => {
    CommunityDailyMetricsService.getHistoricalSSI(
        req.params.publicId
    ).then((community) => {
        res.send(community);
    }).catch((e) => controllerLogAndFail(e, 500, res));
}

const getAll = (req: Request, res: Response) => {
    CommunityService.getAll(req.params.status)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 500, res));
}

const list = (req: Request, res: Response) => {
    CommunityService.list()
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 500, res));
}

const listFull = (req: Request, res: Response) => {
    CommunityService.listFull()
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 500, res));
}

const managers = (req: Request, res: Response) => {
    CommunityService.managers((req as any).user.address)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 500, res));
}

const managersDetails = (req: Request, res: Response) => {
    CommunityService.managersDetails((req as any).user.address)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 500, res));
}

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
}

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
    ManagerService.get((req as any).user).then((manager) => {
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
                .then((updateResult) => res.status(200).send(updateResult[1][0]))
                .catch((e) => controllerLogAndFail(e, 404, res));
        } else {
            Logger.warn(`Not admin of ${publicId}`);
            res.status(403).send(`Not admin of ${publicId}`);
        }
    }).catch((e) => controllerLogAndFail(e, 404, res));
}

const accept = (req: Request, res: Response) => {
    const {
        acceptanceTransaction, // the address accepting the request (must be admin)
        publicId,
    } = req.body;
    CommunityService.accept(acceptanceTransaction, publicId)
        .then(() => res.sendStatus(202))
        .catch((e) => controllerLogAndFail(e, 403, res));
}

export default {
    findByContractAddress,
    findByPublicId,
    get,
    getHistoricalSSI,
    getAll,
    list,
    listFull,
    managers,
    managersDetails,
    create,
    edit,
    accept
}