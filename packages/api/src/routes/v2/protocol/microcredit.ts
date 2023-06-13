import { Router } from 'express';

import ProtocolController from '../../../controllers/v2/protocol';
import { cache } from '../../../middlewares/cache-redis';
import { cacheIntervals } from '../../../utils/api';

export default (route: Router): void => {
    const protocolController = new ProtocolController();

    /**
     * @swagger
     *
     * /protocol/microcredit:
     *   get:
     *     tags:
     *       - "protocol"
     *     summary: "Get Global MicroCredit Data"
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get(
        '/microcredit',
        cache(cacheIntervals.oneHour),
        protocolController.getMicroCreditData
    );
};
