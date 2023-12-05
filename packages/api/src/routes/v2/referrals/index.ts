import { Router } from 'express';

import { authenticateToken, verifyTypedSignature } from '~middlewares/index';
import { cache } from '~middlewares/cache-redis';
import { cacheIntervals } from '~utils/api';
import { getReferralCodeValidator, referralPostValidator } from '~validators/referral';
import ReferralController from '~controllers/v2/referral';

export default (app: Router): void => {
    const controller = new ReferralController();
    const route = Router();
    app.use('/referrals', route);

    /**
     * @swagger
     *
     * /referrals:
     *   get:
     *     tags:
     *       - "referrals"
     *     summary: "Get user referrals data"
     *     description: "This GET method is used to get the campaigns the user is allowed to participate!"
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.get('/', authenticateToken, controller.get);

    /**
     * @swagger
     *
     * /referrals/{cid}:
     *   get:
     *     tags:
     *       - "referrals"
     *     summary: "Get user referral data for a given campaign"
     *     description: "This GET method is used to generate the user referral code, or, if it aready exists, simply return it. This method requires the user to be authenticated and provide an EIP712 signature. Use the utils demo to generate the signature."
     *     parameters:
     *       - in: path
     *         name: cid
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
     *     - SignatureEIP712Signature: []
     *     - SignatureEIP712Value: []
     */
    route.get(
        '/:cid',
        authenticateToken,
        verifyTypedSignature,
        cache(cacheIntervals.fiveMinutes),
        getReferralCodeValidator,
        controller.getByCampaign
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
