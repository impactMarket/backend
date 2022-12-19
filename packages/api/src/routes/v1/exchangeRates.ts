import { services } from '@impactmarket/core';
import { Router, Request, Response } from 'express';

export default (app: Router): void => {
    const route = Router();
    app.use('/exchange-rates', route);

    /**
     * @deprecated use /exchange-rate
     */
    route.get('/', (req: Request, res: Response) => {
        new services.app.ExchangeRatesService()
            .get()
            .then((rates) => res.send(rates))
            .catch((r) => res.send(r).status(403));
    });
};
