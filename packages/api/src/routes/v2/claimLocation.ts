import { database } from '@impactmarket/core';
import { Router } from 'express';

import claimLocationController from '../../controllers/claimLocation';
import { authenticateToken } from '../../middlewares';
import claimLocationValidators from '../../validators/claimLocation';

export default (app: Router): void => {
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
    route.get(
        '/',
        database.cacheWithRedis('1 day', database.cacheOnlySuccess),
        claimLocationController.getAll
    );

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
     *     - api_auth:
     *       - "write:modify":
     */
    route.post(
        '/',
        authenticateToken,
        claimLocationValidators.add,
        claimLocationController.add
    );
};
