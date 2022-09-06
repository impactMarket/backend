import { config, services } from '@impactmarket/core';
import { Request, Response } from 'express';

import { RequestWithUser } from '../../middlewares/core';
import { standardResponse } from '../../utils/api';

class LearnAndEarnController {
    learnAndEarnService = new services.LearnAndEarnService();

    total = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        this.learnAndEarnService
            .total(req.user.userId)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    listLevels = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        let { category, state, level, limit, offset } = req.query;

        if (!state || typeof state !== 'string') {
            state = 'available';
        }
        if (offset === undefined || typeof offset !== 'string') {
            offset = config.defaultOffset.toString();
        }
        if (limit === undefined || typeof limit !== 'string') {
            limit = config.defaultLimit.toString();
        }

        this.learnAndEarnService
            .listLevels(
                req.user.userId,
                state,
                parseInt(offset, 10),
                parseInt(limit, 10),
                category as string,
                level as string
            )
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    answer = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        const { answers } = req.body;

        this.learnAndEarnService
            .answer(req.user.userId, answers)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default LearnAndEarnController;
