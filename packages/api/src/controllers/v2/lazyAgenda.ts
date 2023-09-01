import { Response } from 'express';
import { services } from '@impactmarket/core';

import { AddUserLazyAgendaItem } from '~validators/lazyAgenda';
import { RequestWithUser } from '~middlewares/core';
import { standardResponse } from '~utils/api';

class LazyAgendaController {
    private lazyAgendaService: services.app.LazyAgendaService;
    constructor() {
        this.lazyAgendaService = new services.app.LazyAgendaService();
    }

    get = (req: RequestWithUser, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }
        this.lazyAgendaService
            .get(req.user.userId)
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };

    add = (req: RequestWithUser<any, any, AddUserLazyAgendaItem>, res: Response) => {
        if (req.user === undefined) {
            standardResponse(res, 401, false, '', {
                error: {
                    name: 'USER_NOT_FOUND',
                    message: 'User not identified!'
                }
            });
            return;
        }

        this.lazyAgendaService
            .add({ userId: req.user.userId, ...req.body })
            .then(r => standardResponse(res, 200, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    };
}

export { LazyAgendaController };
