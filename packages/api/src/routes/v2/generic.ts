import { Router } from 'express';

import GenericController from '../../controllers/v2/generic';
import { cache } from '../../middlewares/cache-redis';
import { cacheIntervals } from '../../utils/api';

export default (app: Router): void => {
    const genericController = new GenericController();

    /**
     * @swagger
     *
     * /exchange-rates:
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
    app.get(
        '/exchange-rates',
        cache(cacheIntervals.twelveHours),
        genericController.exchangeRates
    );

    /**
     * @swagger
     *
     * /wallet-airdrop/{address}:
     *   get:
     *     tags:
     *       - "generic"
     *     summary: Get wallet airdrop.
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
    app.get('/wallet-airdrop/:address', genericController.getWalletAirdrop);

    /**
     * @swagger
     *
     * /cashout-providers:
     *   get:
     *     tags:
     *       - "generic"
     *     summary: Get cachout providers.
     *     parameters:
     *       - in: query
     *         name: country
     *         schema:
     *           type: string
     *         required: false
     *         description: filter by country
     *       - in: query
     *         name: lat
     *         schema:
     *           type: number
     *         required: false
     *         description: latitude used for nearest location
     *       - in: query
     *         name: lng
     *         schema:
     *           type: number
     *         required: false
     *         description: longitude used for nearest location
     *       - in: query
     *         name: distance
     *         schema:
     *           type: number
     *         required: false
     *         description: distance in kilometers between the user location and providers
     *     responses:
     *       "200":
     *         description: OK
     */
    app.get(
        '/cashout-providers/:query?',
        genericController.getCashoutProviders
    );
};
