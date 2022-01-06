import { RequestWithUser } from '../middlewares/core';
import { utils, services } from 'impactmarket-core';
import { Request, Response } from 'express';

class StoryController {
    storyService = new services.StoryService();

    getPresignedUrlMedia = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            utils.api.standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .getPresignedUrlMedia(req.params.mime)
            .then((r) => utils.api.standardResponse(res, 200, true, r))
            .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
    };

    add = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            utils.api.standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .add(req.user.address, req.body)
            .then((r) => utils.api.standardResponse(res, 200, true, r))
            .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
    };

    has = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            utils.api.standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .has(req.user.address)
            .then((r) => utils.api.standardResponse(res, 200, true, r))
            .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
    };

    remove = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            utils.api.standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .remove(parseInt(req.params.id, 10), req.user.address)
            .then((r) => utils.api.standardResponse(res, 200, r !== 0, r))
            .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
    };

    getByUser = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            utils.api.standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .getByUser(req.user.address, req.query)
            .then((r) =>
                utils.api.standardResponse(res, 200, true, r.content, { count: r.count })
            )
            .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
    };

    listByOrder = (req: Request, res: Response) => {
        this.storyService
            .list(req.query)
            .then((r) =>
                utils.api.standardResponse(res, 200, true, r.content, { count: r.count })
            )
            .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
    };

    getByCommunity = (req: RequestWithUser, res: Response) => {
        this.storyService
            .getByCommunity(
                parseInt(req.params.id, 10),
                req.query ? req.query : {},
                req.user?.address
            )
            .then((r) =>
                utils.api.standardResponse(res, 200, true, r.content, { count: r.count })
            )
            .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
    };

    love = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            utils.api.standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .love(req.user.address, parseInt(req.params.id, 10))
            .then((r) => utils.api.standardResponse(res, 200, true, r))
            .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
    };

    inapropriate = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            utils.api.standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .inapropriate(req.user.address, parseInt(req.params.id, 10))
            .then((r) => utils.api.standardResponse(res, 200, true, r))
            .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
    };
}

export default StoryController;
