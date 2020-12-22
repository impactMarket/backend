import { Router, Request, Response } from 'express';

import ExchangeRatesService from '../services/exchangeRates';

const route = Router();

export default (app: Router): void => {
    app.use('/exchange-rates', route);

    route.get('/', async (req: Request, res: Response) => {
        return res.send(await ExchangeRatesService.get());
    });
};
