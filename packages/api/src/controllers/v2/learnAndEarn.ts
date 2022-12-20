import { config, services } from '@impactmarket/core';
import { Request, Response } from 'express';
import {
    AnswerRequestType,
    ListLevelsRequestType,
    RegisterClaimRewardsRequestType,
    StartLessonRequestType,
} from 'validators/learnAndEarn';

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

    listLevels = (
        req: RequestWithUser<never, never, never, ListLevelsRequestType>,
        res: Response
    ) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        let { category, status, level, limit, offset } = req.query;

        if (offset === undefined || typeof offset !== 'string') {
            offset = config.defaultOffset.toString();
        }
        if (limit === undefined || typeof limit !== 'string') {
            limit = config.defaultLimit.toString();
        }

        this.learnAndEarnService
            .listLevels(
                req.user.userId,
                parseInt(offset, 10),
                parseInt(limit, 10),
                status,
                category,
                level
            )
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    registerClaimRewards = (
        req: RequestWithUser<never, never, RegisterClaimRewardsRequestType>,
        res: Response
    ) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        const { transactionHash } = req.body;

        this.learnAndEarnService
            .registerClaimRewards(req.user.userId, transactionHash)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    listLessons = (req: RequestWithUser<{ id: string }>, res: Response) => {
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
            .listLessons(req.user.userId, parseInt(req.params.id, 10))
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    answer = (
        req: RequestWithUser<never, never, AnswerRequestType>,
        res: Response
    ) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        const { answers, lesson } = req.body;

        this.learnAndEarnService
            .answer(req.user, answers, lesson)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    startLesson = (
        req: RequestWithUser<never, never, StartLessonRequestType>,
        res: Response
    ) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        const { lesson } = req.body;

        this.learnAndEarnService
            .startLesson(req.user.userId, lesson)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    webhook = (req: Request, res: Response) => {
        const { documents } = req.body;

        if (!documents || !documents.length) {
            standardResponse(res, 400, false, '', {
                error: {
                    name: 'INVALID_DOCUMENTS',
                    message: 'invalid documents',
                },
            });
            return;
        }

        this.learnAndEarnService
            .webhook(documents)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default LearnAndEarnController;
