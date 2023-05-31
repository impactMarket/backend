import { Router } from 'express';

import { CommunityController } from '../../../controllers/v2/community/create';
import { authenticateToken, verifySignature } from '../../../middlewares';
import CommunityValidator from '../../../validators/community';

export default (route: Router): void => {
    const controller = new CommunityController();

    /**
     * @swagger
     *
     * /communities:
     *   post:
     *     tags:
     *       - "communities"
     *     summary: Create communities
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              requestByAddress:
     *                type: string
     *                required: false
     *              name:
     *                type: string
     *                required: true
     *              contractAddress:
     *                type: string
     *                required: false
     *              description:
     *                type: string
     *                required: true
     *              language:
     *                type: string
     *                required: true
     *              currency:
     *                type: string
     *                required: true
     *              city:
     *                type: string
     *                required: true
     *              country:
     *                type: string
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
     *              email:
     *                type: string
     *                required: true
     *              coverMediaPath:
     *                type: string
     *                required: true
     *              txReceipt:
     *                type: object
     *                required: false
     *              contractParams:
     *                type: object
     *                required: true
     *                properties:
     *                  claimAmount:
     *                    type: number
     *                    required: true
     *                  maxClaim:
     *                    type: number
     *                    required: true
     *                  baseInterval:
     *                    type: number
     *                    required: true
     *                  incrementInterval:
     *                    type: number
     *                    required: true
     *                  minTranche:
     *                    type: number
     *                    required: false
     *                  maxTranche:
     *                    type: number
     *                    required: false
     *              placeId:
     *                type: string
     *                required: false
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.post(
        '/',
        authenticateToken,
        CommunityValidator.create,
        controller.create
    );

    /**
     * @swagger
     *
     * /communities/{id}:
     *   patch:
     *     tags:
     *       - "communities"
     *     summary: Edit pending community submission
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
     *                     type: number
     *                   maxClaim:
     *                     type: number
     *                   baseInterval:
     *                     type: number
     *                   incrementInterval:
     *                     type: number
     *                   minTranche:
     *                     type: number
     *                     required: false
     *                   maxTranche:
     *                     type: number
     *                     required: false
     *               placeId:
     *                 type: string
     *                 required: false
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
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
     *     summary: Edit community review
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               review:
     *                 type: string
     *                 enum: [claimed, declined, pending, accepted]
     *                 required: true
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.put(
        '/:id/review',
        authenticateToken,
        CommunityValidator.review,
        controller.review
    );

    /**
     * @swagger
     *
     * /communities/{id}:
     *   put:
     *     tags:
     *       - "communities"
     *     summary: Edit a valid community
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              name:
     *                type: string
     *                required: false
     *              description:
     *                type: string
     *                required: false
     *              coverMediaPath:
     *                type: string
     *                required: false
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     *     - SignatureMessage: []
     *     - Signature: []
     */
    route.put(
        '/:id',
        authenticateToken,
        verifySignature,
        CommunityValidator.edit,
        controller.edit
    );
};
