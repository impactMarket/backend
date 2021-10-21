import { standardResponse } from '@utils/api';
import { Router } from 'express';

import config from '../../config';

const route = Router();

export default (app: Router): void => {

    /**
     * @deprecated use /app-version
     */
    app.get('/mobile/version', (req, res) => {
        res.send({
            latest: config.mobileVersion.latest,
            minimal: config.mobileVersion.minimal,
            timestamp: new Date().getTime(),
        });
    });

    /**
     * @swagger
     *
     * /app-version:
     *   get:
     *     tags:
     *       - "mobile"
     *     summary: Get the app version.
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: object
     *                   properties:
     *                     latest:   
     *                       type: string
     *                     minimal:
     *                       type: string
     *                     timestamp:
     *                       type: number
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    app.get('/app-version', (req, res) => standardResponse(res, 200, true, {
        latest: config.mobileVersion.latest,
        minimal: config.mobileVersion.minimal,
        timestamp: new Date().getTime(),
    }));
};
