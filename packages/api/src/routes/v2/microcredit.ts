import { Router } from 'express';

import MicrocreditController from '../../controllers/v2/microcredit';
import { cache } from '../../middlewares/cache-redis';
import { cacheIntervals } from '../../utils/api';

export default (app: Router): void => {
    const microcreditController = new MicrocreditController();
    const route = Router();
    app.use('/microcredit', route);

    /**
     * @swagger
     *
     * /microcredit/global:
     *   get:
     *     tags:
     *       - "microcredit"
     *     summary: "Get Glboal Data"
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/global',
        cache(cacheIntervals.oneHour),
        microcreditController.getGlobalData
    );
};