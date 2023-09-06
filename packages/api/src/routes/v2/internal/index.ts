import { Request, Response, Router } from 'express';

import { services } from '@impactmarket/core';
import { standardResponse } from '~utils/api';

const { InternalDataService } = services;

export default (app: Router): void => {
    const service = new InternalDataService();

    app.get('/internal/communities-monthly-donations', (req: Request, res: Response) => {
        service
            .getMonthlyDonationsByCommunity()
            .then(r => standardResponse(res, 201, true, r))
            .catch(e => standardResponse(res, 400, false, '', { error: e }));
    });
};
