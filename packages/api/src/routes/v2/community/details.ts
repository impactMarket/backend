import { Router } from 'express';

import { CommunityController } from '../../../controllers/v2/community/details';

export default (route: Router): void => {
    const controller = new CommunityController();

    /**
     * @swagger
     *
     * /community/{id}/state:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community state
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: community id
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/:id/state', controller.getState);

    /**
     * @swagger
     *
     * /community/{id}/ubi-params:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community contract UBI parameters
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: community id
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/:id/ubi-params', controller.getUBIParams);
};
