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

        services.learnAndEarn
            .total(req.user.userId)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    listLevels = (
        req: RequestWithUser<never, never, never, ListLevelsRequestType>,
        res: Response
    ) => {
        let { category, status, level, limit, offset, language } = req.query;

        if (offset === undefined || typeof offset !== 'string') {
            offset = config.defaultOffset.toString();
        }
        if (limit === undefined || typeof limit !== 'string') {
            limit = config.defaultLimit.toString();
        }

        services.learnAndEarn
            .listLevels(
                parseInt(offset, 10),
                parseInt(limit, 10),
                req.user?.userId,
                status,
                level,
                language,
            )
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    listLevelsByAdmin = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        services.learnAndEarn
            .listLevelsByAdmin(req.user.userId)
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

        services.learnAndEarn
            .registerClaimRewards(req.user.userId, transactionHash)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    listLessons = (req: RequestWithUser<{ id: string }>, res: Response) => {
        let { language } = req.query;

        const id = parseInt(req.params.id, 10);

        services.learnAndEarn
            .listLessons(id ? id : req.params.id, req.user?.userId, language as string)
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

        services.learnAndEarn
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

        services.learnAndEarn
            .startLesson(req.user.userId, lesson)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    webhook = (req: Request, res: Response) => {
        // const { documents } = req.body;

        // if (!documents || !documents.length) {
        //     standardResponse(res, 400, false, '', {
        //         error: {
        //             name: 'INVALID_DOCUMENTS',
        //             message: 'invalid documents',
        //         },
        //     });
        //     return;
        // }
        services.learnAndEarn
            .webhook([])
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    createLevel = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!',
                },
            });
            return;
        }

        services.learnAndEarn
            .createLevel(req.user.userId, req.body.rules)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    }
}

export default LearnAndEarnController;
