import { Router } from 'express';

import { attestation } from '../../../controllers/v2/attestation';
import { authenticateToken } from '../../../middlewares';
import { attestationValidator } from '../../../validators/attestation';

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
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post('/', authenticateToken, attestationValidator, attestation);
};
