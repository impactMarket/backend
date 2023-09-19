import { Router } from 'express';

import { ClaimLocationController } from '../../controllers/v2/claimLocation';
import { authenticateToken } from '../../middlewares';
import claimLocationValidators from '../../validators/claimLocation';
import { cache } from '../../middlewares/cache-redis';
import { cacheIntervals } from '../../utils/api';

export default (app: Router): void => {
    const controller = new ClaimLocationController();
    const route = Router();
    app.use('/claims-location', route);

    /**
     * @swagger
     *
     * /claims-location:
     *   get:
     *     tags:
     *     - "claims-location"
     *     summary: "Get all claim locations on the last X period"
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     */
    route.get('/', cache(cacheIntervals.oneDay), controller.getAll);

    /**
     * @swagger
     *
     * /claims-location:
     *   post:
     *     tags:
     *     - "claims-location"
     *     summary: "Register a claim location"
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              communityId:
     *                type: number
     *                required: true
     *              gps:
     *                type: object
     *                required: true
     *                properties:
     *                  latitude:
     *                    type: number
     *                    required: true
     *                  longitude:
     *                    type: number
     *                    required: true
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.post('/', authenticateToken, claimLocationValidators.add, controller.add);
};
