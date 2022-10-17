import { services } from '@impactmarket/core';
import { Request, Response } from 'express';

import { RequestWithUser } from '../../middlewares/core';
import { standardResponse } from '../../utils/api';

class StoryController {
    storyService = new services.StoryServiceV2();

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
            .getPresignedUrlMedia(req.query)
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
        const { message, storyMediaPath, storyMedia } = req.body;
        this.storyService
            .add(req.user.address, {
                message,
                storyMediaPath,
                storyMedia,
            })
            .then((r) => standardResponse(res, 200, true, r))
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

    getById = (req: RequestWithUser, res: Response) => {
        this.storyService
            .getById(parseInt(req.params.id, 10), req.user?.address)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    list = (req: RequestWithUser, res: Response) => {
        const { user } = req.query;
        if (user) {
            if (req.user === undefined || user !== req.user.address) {
                standardResponse(res, 401, false, '', {
                    error: {
                        name: 'NOT_ALLOWED',
                        message: 'Not allowed!',
                    },
                });
                return;
            }
            this.storyService
                .listByUser(req.user.address, req.query)
                .then((r) =>
                    standardResponse(res, 200, true, r.content, {
                        count: r.count,
                    })
                )
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        } else {
            this.storyService
                .list(req.query, req.user?.address)
                .then((r) =>
                    standardResponse(res, 200, true, r.content, {
                        count: r.count,
                    })
                )
                .catch((e) =>
                    standardResponse(res, 400, false, '', { error: e })
                );
        }
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
        const { typeId } = req.body;
        this.storyService
            .inapropriate(req.user.address, parseInt(req.params.id, 10), typeId)
            .then((r) => standardResponse(res, 200, true, r))
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
        this.storyService
            .count(groupBy as string)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    addComment = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }
        const { comment } = req.body;

        this.storyService
            .addComment(req.user.userId, parseInt(req.params.id, 10), comment)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getComments = (req: Request, res: Response) => {
        this.storyService
            .getComments(parseInt(req.params.id, 10), req.query)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    removeComment = (req: RequestWithUser, res: Response) => {
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
            .removeComment(
                req.user,
                parseInt(req.params.id, 10),
                parseInt(req.params.commentId, 10)
            )
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default StoryController;
