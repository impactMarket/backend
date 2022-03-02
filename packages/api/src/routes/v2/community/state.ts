import { Router } from 'express';

import { CommunityController } from '../../../controllers/v2/community/state';

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
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UbiCommunityState'
     */
    route.get('/:id/state', controller.getState);
};
