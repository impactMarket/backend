import { Router } from 'express';

import ReferralController from '~controllers/v2/referral';
import { cache } from '~middlewares/cache-redis';
import { authenticateToken } from '~middlewares/index';
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
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     */
    route.get('/', cache(cacheIntervals.oneHour), controller.get);

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
