import { Request, Response, Router } from 'express';

import { cache } from '../../../middlewares/cache-redis';
import { cacheIntervals } from '../../../utils/api';
import { circulatingSupply } from '~controllers/v2/circulatingSupply';

export default (route: Router): void => {
    /**
     * @swagger
     *
     * /protocol/circulating-supply:
     *   get:
     *     tags:
     *       - "generic"
     *     summary: Gets PACT circulating supply.
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/circulating-supply', cache(cacheIntervals.oneDay), circulatingSupply);

    /**
     * @swagger
     *
     * /protocol/total-supply:
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
    route.get('/total-supply', (_req: Request, res: Response) => res.send(100_000_000_000));
};
