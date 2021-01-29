import { Router, Request, Response } from 'express';

import ExchangeRatesService from '@services/exchangeRates';

export default (app: Router): void => {
    const route = Router();
    app.use('/exchange-rates', route);

    route.get('/', (req: Request, res: Response) => {
        ExchangeRatesService.get()
            .then((rates) => res.send(rates))
            .catch((r) => res.send(r).status(403));
    });
};
