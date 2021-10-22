import ExchangeRatesService from '@services/app/exchangeRates';
import { standardResponse } from '@utils/api';
import { Router, Request, Response } from 'express';

import config from '../../config';

export default (app: Router): void => {
    /**
     * @swagger
     *
     * /app-version:
     *   get:
     *     tags:
     *       - "generic"
     *     summary: Get the app version.
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
     *                   type: object
     *                   properties:
     *                     latest:
     *                       type: string
     *                     minimal:
     *                       type: string
     *                     timestamp:
     *                       type: number
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    app.get('/app-version', (req, res) =>
        standardResponse(res, 200, true, {
            latest: config.mobileVersion.latest,
            minimal: config.mobileVersion.minimal,
            timestamp: new Date().getTime(),
        })
    );

    /**
     * @swagger
     *
     * /exchange-rate:
     *   get:
     *     tags:
     *       - "generic"
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

    /**
     * @swagger
     *
     * /time:
     *   get:
     *     tags:
     *       - "generic"
     *     summary: Gets the time value in milliseconds.
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
     *                   type: number
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    app.get('/time', (req: Request, res: Response) =>
        standardResponse(res, 200, true, new Date().getTime())
    );
};
