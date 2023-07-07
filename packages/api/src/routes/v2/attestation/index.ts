import { Router } from 'express';

import { attestation } from '../../../controllers/v2/attestation';
import { attestationValidator } from '../../../validators/attestation';
import { authenticateToken } from '../../../middlewares';

export default (app: Router): void => {
    const route = Router();
    app.use('/attestation', route);

    /**
     * @swagger
     *
     * /attestation:
     *   post:
     *     tags:
     *     - "attestation"
     *     summary: "Attestation"
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              plainTextIdentifier:
     *                type: string
     *                required: true
     *              code:
     *                type: string
     *                required: false
     *              type:
     *                type: number
     *                required: true
     *              service:
     *                type: string
     *                enum: [verify, send]
     *                required: true
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.post('/', authenticateToken, attestationValidator, attestation);
};
