import { Router } from 'express';
import timeout from 'connect-timeout';

import { MicroCreditController } from '../../../controllers/v2/microcredit/create';
import { preSignerUrlFromAWSValidator } from '../../../validators/microcredit';
import { authenticateToken } from '../../../middlewares';

export default (route: Router): void => {
    const controller = new MicroCreditController();

    /**
     * @swagger
     *
     * /microcredit/presigned:
     *   get:
     *     tags:
     *       - "users"
     *     summary: "Get AWS presigned URL to upload media content"
     *     parameters:
     *       - in: query
     *         name: mime
     *         schema:
     *           type: string
     *         required: true
     *         description: media mimetype
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/presigned/:query?',
        authenticateToken,
        preSignerUrlFromAWSValidator,
        timeout('3s'),
        controller.getPresignedUrlMedia
    );
};
