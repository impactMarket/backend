import { Router } from 'express';

import { CommunityController } from '../../../controllers/v2/community/edit';
import { authenticateToken } from '../../../middlewares';
import CommunityValidator from '../../../validators/community';

export default (route: Router): void => {
    const controller = new CommunityController();

    /**
     * @swagger
     *
     * /communities/{id}:
     *   patch:
     *     tags:
     *       - "communities"
     *     summary: Edit pending community
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 required: true
     *               description:
     *                 type: string
     *                 required: true
     *               language:
     *                 type: string
     *                 required: true
     *               currency:
     *                 type: string
     *                 required: true
     *               city:
     *                 type: string
     *                 required: true
     *               country:
     *                 type: string
     *                 required: true
     *               email:
     *                 type: string
     *                 required: true
     *               coverMediaPath:
     *                 type: string
     *                 required: true
     *               gps:
     *                 type: object
     *                 required: false
     *                 properties:
     *                   latitude:
     *                     type: number
     *                   longitude:
     *                     type: number
     *               contractParams:
     *                 type: object
     *                 required: false
     *                 properties:
     *                   claimAmount:
     *                     type: string
     *                   maxClaim:
     *                     type: string
     *                   baseInterval:
     *                     type: number
     *                   incrementInterval:
     *                     type: number
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.patch(
        '/:id',
        authenticateToken,
        CommunityValidator.editSubmission,
        controller.editSubmission
    );

    /**
     * @swagger
     *
     * /communities/{id}/review:
     *   put:
     *     tags:
     *       - "communities"
     *     summary: Edit pending community
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               review:
     *                 type: string
     *                 enum: [claimed, declined]
     *                 required: true
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.put(
        '/:id/review',
        authenticateToken,
        CommunityValidator.review,
        controller.review
    );
};
