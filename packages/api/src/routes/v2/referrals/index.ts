import { Router } from 'express';

import ReferralController from '~controllers/v2/referral';
import { cache } from '~middlewares/cache-redis';
import { authenticateToken, verifyTypedSignature } from '~middlewares/index';
import { cacheIntervals } from '~utils/api';
import { referralPostValidator } from '~validators/referral';

export default (app: Router): void => {
    const controller = new ReferralController();
    const route = Router();
    app.use('/referrals', route);

    /**
     * @swagger
     *
     * /referrals/{campaignId}:
     *   get:
     *     tags:
     *       - "referrals"
     *     summary: "Get user referral data"
     *     description: "This GET method is used to generate the user referral code, or, if it aready exists, simply return it. This method requires the user to be authenticated and provide an EIP712 signature. Use the utils demo to generate the signature."
     *     parameters:
     *       - in: path
     *         name: campaignId
     *         schema:
     *           type: integer
     *         required: true
     *         description: campaign id
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     *     - SignatureMessage: []
     *     - SignatureExpiry: []
     *     - Signature: []
     */
    route.get(
        '/:campaignId',
        authenticateToken,
        verifyTypedSignature,
        cache(cacheIntervals.tenMinutes),
        controller.get
    );

    /**
     * @swagger
     *
     * /referrals:
     *   post:
     *     tags:
     *     - "referrals"
     *     summary: "Use a referral code"
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              code:
     *                type: string
     *                required: true
     *                example: a84349a0
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.post('/', authenticateToken, verifyTypedSignature, referralPostValidator, controller.post);
};
