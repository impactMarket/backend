import { Router } from 'express';

import ProtocolController from '../../../controllers/v2/protocol';
import { cache } from '../../../middlewares/cache-redis';
import { cacheIntervals } from '../../../utils/api';
import { saveForm } from '../../../validators/microcredit';
import { authenticateToken } from '../../../middlewares';

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

    /**
     * @swagger
     *
     * /protocol/microcredit:
     *   post:
     *     tags:
     *       - "protocol"
     *     summary: "Save MicroCredit Form"
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              form:
     *                type: object
     *                required: true
     *              submit:
     *                type: boolean
     *                required: false
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.post(
        '/microcredit',
        authenticateToken,
        saveForm,
        protocolController.saveForm
    )
};
