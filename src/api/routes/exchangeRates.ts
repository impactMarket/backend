import ExchangeRatesService from '@services/app/exchangeRates';
import { standardResponse } from '@utils/api';
import { Router, Request, Response } from 'express';

export default (app: Router): void => {

    /**
     * @deprecated use /exchange-rate
     */
    app.get('/exchange-rates', (req: Request, res: Response) => {
        ExchangeRatesService.get()
            .then((rates) => res.send(rates))
            .catch((r) => res.send(r).status(403));
    });

    /**
     * @swagger
     *
     * /exchange-rate:
     *   get:
     *     tags:
     *       - "rates"
     *     summary: Get exchange rates.
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       currency:   
     *                         type: string
     *                       rate:
     *                         type: number
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    app.get('/exchange-rate', (req: Request, res: Response) => {
        ExchangeRatesService.get()
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    });
};
