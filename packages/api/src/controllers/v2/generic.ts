import { services } from '@impactmarket/core';
import { Request, Response } from 'express';

import { standardResponse } from '../../utils/api';

class GenericController {
    private exchangeRatesService: services.app.ExchangeRatesService;
    constructor() {
        this.exchangeRatesService = new services.app.ExchangeRatesService();
    }

    exchangeRates = (req: Request, res: Response) => {
        this.exchangeRatesService
            .get()
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default GenericController;
