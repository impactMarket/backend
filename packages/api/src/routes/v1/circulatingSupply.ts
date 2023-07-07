import { Request, Response, Router } from 'express';

import { cache } from '../../middlewares/cache-redis';
import { cacheIntervals } from '../../utils/api';
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
    app.get('/circulating-supply', cache(cacheIntervals.oneDay), circulatingSupply);

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
    app.get('/total-supply', (_req: Request, res: Response) => res.send('10000000000'));
};
