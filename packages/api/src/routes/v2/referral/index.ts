import { Router } from 'express';

import ReferralController from '~controllers/v2/referral';
import { cache } from '~middlewares/cache-redis';
import { authenticateToken, verifyTypedSignature } from '~middlewares/index';
import { cacheIntervals } from '~utils/api';
import { referralPostValidator } from '~validators/referral';

export default (app: Router): void => {
    const controller = new ReferralController();
    const route = Router();
    app.use('/referral', route);

    /**
     * @swagger
     *
     * /referral:
     *   get:
     *     tags:
     *     - "referrals"
     *     summary: "Get user referral data"
     *     description: "This GET method is used to generate the user referral code, or, if it aready exists, simply return it. This method requires the user to be authenticated and provide an EIP712 signature. Use the utils demo to generate the signature."
     *     parameters:
     *       - in: query
     *         name: campaignId
     *         schema:
     *           type: string
     *         required: true
     *         description: campaign id
     *       - in: header
     *         name: signature
     *         schema:
     *           type: string
     *         required: true
     *         description: EIP712 signature
     *       - in: header
     *         name: expiry
     *         schema:
     *           type: string
     *         required: true
     *         description: expiry value to include in EIP712 signature
     *       - in: header
     *         name: message
     *         schema:
     *           type: string
     *         required: true
     *         description: message value to include in EIP712 signature
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     */
    route.get(
        '/:campaignId',
        authenticateToken,
        verifyTypedSignature,
        cache(cacheIntervals.oneHour),
        controller.get
    );

    /**
     * @swagger
     *
     * /referral:
     *   post:
     *     tags:
     *     - "referrals"
     *     summary: "Use a referral code"
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post('/', authenticateToken, referralPostValidator, controller.post);
};
