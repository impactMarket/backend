import { database } from '@impactmarket/core';
import { Router, Request, Response } from 'express';

import { circulatingSupply } from '../../controllers/v1/circulatingSupply';

export default (app: Router): void => {
    /**
     * @swagger
     *
     * /circulating-supply:
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
        database.cacheWithRedis('50 minutes', database.cacheOnlySuccess),
        circulatingSupply
    );

    /**
     * @swagger
     *
     * /total-supply:
     *   get:
     *     tags:
     *       - "generic"
     *     summary: Gets total PACT supply.
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
    app.get('/total-supply', (_req: Request, res: Response) =>
        res.send('10000000000')
    );
};
