import { Router } from 'express';

import LearnAndEarnController from '../../controllers/v2/learnAndEarn';
import { authenticateToken, optionalAuthentication } from '../../middlewares';
import LearnAndEarnValidator from '../../validators/learnAndEarn';

export default (app: Router): void => {
    const learnAndEarnController = new LearnAndEarnController();
    const learnAndEarnValidator = new LearnAndEarnValidator();
    const route = Router();
    app.use('/learn-and-earn', route);

    /**
     * @swagger
     *
     * /learn-and-earn/total:
     *   get:
     *     tags:
     *       - "learn-and-earn"
     *     summary: "Get total metrics"
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get('/total', authenticateToken, learnAndEarnController.total);
};
