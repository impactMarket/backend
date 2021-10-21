import { standardResponse } from '@utils/api';
import { Router, Request, Response } from 'express';

export default (app: Router): void => {
    const route = Router();
    app.use('/time', route);

    /**
     * @swagger
     *
     * /time:
     *   get:
     *     tags:
     *       - "time"
     *     summary: Gets the time value in milliseconds.
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
     *                   type: number
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get('/', (req: Request, res: Response) => {
        standardResponse(res, 200, true, new Date().getTime());
    });
};
