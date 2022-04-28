import { Router } from 'express';

import { CommunityController } from '../../../controllers/v2/community/details';
import { optionalAuthentication } from '../../../middlewares';
import { database } from '@impactmarket/core';

export default (route: Router): void => {
    const controller = new CommunityController();

    /**
     * @swagger
     *
     * /communities/count:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Count grouped communities
     *     parameters:
     *       - in: query
     *         name: groupBy
     *         schema:
     *           type: string
     *           enum: [country]
     *         required: true
     *         description: count communities by a grouped value
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   unknown:
     *                     type: string
     *                     description: this variable name changes depending on the request. If the groupBy is "country" then this variable is named "country" and the value is the country.
     *                   count:
     *                     type: string
     */
     route.get(
        '/count/:query?',
        database.cacheWithRedis('5 minutes', database.cacheOnlySuccess),
        controller.count
    );

    /**
     * @swagger
     *
     * /communities/{id}/managers:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Get community managers
     *     parameters:
     *       - in: query
     *         name: filterByActive
     *         schema:
     *           type: boolean
     *         required: false
     *         description: filter by active/inactive/both (if filterByActive = undefined return both)
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: community id
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/getManagersResponse'
     */
    route.get('/:id/managers/:query?', controller.getManagers);

    /**
     * @swagger
     *
     * /communities/{id-or-address}:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Get community by id or contract address
     *     parameters:
     *       - in: path
     *         name: id-or-address
     *         schema:
     *           type: string
     *         required: true
     *         description: community id or contract address
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UbiCommunity'
     */
    route.get('/:idOrAddress', optionalAuthentication, controller.findBy);
};
