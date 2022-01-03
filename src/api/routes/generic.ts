import genericController from '@controllers/generic';
import ExchangeRatesService from '@services/app/exchangeRates';
import { standardResponse } from '@utils/api';
import { Router, Request, Response } from 'express';

import config from '../../config';
import { cacheWithRedis } from '../../database';

export default (app: Router): void => {
    /**
     * @swagger
     *
     * /app-version:
     *   get:
     *     tags:
     *       - "generic"
     *     summary: Get the app recommended versions.
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
     */
    app.get('/time', (req: Request, res: Response) =>
        standardResponse(res, 200, true, new Date().getTime())
    );

    /**
     * @swagger
     *
     * /circulating-spply:
     *   get:
     *     tags:
     *       - "generic"
     *     summary: Gets PACT circulating supply.
     *     responses:
     *       "200":
     *         description: OK
     */
    app.get(
        '/circulating-supply',
        cacheWithRedis('10 minutes'),
        genericController.circulatingSupply
    );

    /**
     * @swagger
     *
     * /airgrab/{address}:
     *   get:
     *     tags:
     *       - "generic"
     *     summary: Get airgrab.
     *     parameters:
     *       - in: path
     *         name: address
     *         schema:
     *           type: string
     *         required: true
     *         description: user address
     *     responses:
     *       "200":
     *         description: OK
     */
    app.get('/airgrab/:address', genericController.getAirgrab);
};
