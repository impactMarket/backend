import { config, database, services } from '@impactmarket/core';
import { Request, Response } from 'express';

import { RequestWithUser } from '../middlewares/core';
import { standardResponse } from '../utils/api';

class StoryController {
    storyService = new services.StoryService();

    getPresignedUrlMedia = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .getPresignedUrlMedia(req.params.mime)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    add = async (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        let {
            communityId,
            message,
            storyMediaId,
            storyMediaPath,
        } = req.body;

        if (storyMediaId) {
            const appMedia = await database.models.appMediaContent.findOne({
                attributes: ['url'],
                where: {
                    id: storyMediaId,
                }
            });

            storyMediaPath = appMedia!.url.replace(`${config.cloudfrontUrl}/`, '');
        }

        this.storyService
            .add(req.user.address, {
                communityId,
                message,
                storyMediaPath,
            })
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    has = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .has(req.user.address)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    remove = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .remove(parseInt(req.params.id, 10), req.user.address)
            .then((r) => standardResponse(res, 200, r !== 0, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getByUser = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
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
                standardResponse(res, 200, true, r.content, { count: r.count })
            )
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    listByOrder = (req: Request, res: Response) => {
        this.storyService
            .list(req.query)
            .then((r) =>
                standardResponse(res, 200, true, r.content, { count: r.count })
            )
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getByCommunity = (req: RequestWithUser, res: Response) => {
        this.storyService
            .getByCommunity(
                parseInt(req.params.id, 10),
                req.query ? req.query : {},
                req.user?.address
            )
            .then((r) =>
                standardResponse(res, 200, true, r.content, { count: r.count })
            )
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    love = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .love(req.user.address, parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    inapropriate = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        this.storyService
            .inapropriate(req.user.address, parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default StoryController;
