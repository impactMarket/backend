import { services } from '@impactmarket/core';
import { Response } from 'express';

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

        const { mime } = req.query;

        if (mime === undefined || !(typeof mime === 'string')) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'INVALID_QUERY',
                    message: 'missing mime',
                },
            });
            return;
        }

        this.storyService
            .getPresignedUrlMedia(mime)
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
        const { communityId, message, storyMediaPath } = req.body;
        this.storyService
            .add(req.user.address, {
                communityId,
                message,
                storyMediaPath,
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
}

export default StoryController;
