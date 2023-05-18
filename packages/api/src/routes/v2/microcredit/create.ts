import { Router } from 'express';
import timeout from 'connect-timeout';

import { MicroCreditController } from '../../../controllers/v2/microcredit/create';
import { postDocsValidator, preSignerUrlFromAWSValidator } from '../../../validators/microcredit';
import { authenticateToken, verifySignature } from '../../../middlewares';

export default (route: Router): void => {
    const controller = new MicroCreditController();

    /**
     * @swagger
     *
     * /microcredit/presigned:
     *   get:
     *     tags:
     *       - "microcredit"
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

    /**
     * @swagger
     *
     * /microcredit/docs:
     *   post:
     *     tags:
     *       - "microcredit"
     *     summary: "Add microcredit related docs to a user"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: array
     *             items:
     *               type: object
     *               properties:
     *                 filepath:
     *                   type: string
     *                   example: some/path/to/file.pdf
     *                 category:
     *                   type: number
     *                   example: 1
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post('/docs', authenticateToken, verifySignature, postDocsValidator, controller.postDocs);
};
