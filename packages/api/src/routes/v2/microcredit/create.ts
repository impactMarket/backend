import { Router } from 'express';
import timeout from 'connect-timeout';

import { MicroCreditController } from '../../../controllers/v2/microcredit/create';
import { authenticateToken, onlyAuthorizedRoles, verifySignature } from '../../../middlewares';
import {
    postDocsValidator,
    preSignerUrlFromAWSValidator,
    putApplicationsValidator,
    saveForm
} from '../../../validators/microcredit';

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
     *     - BearerToken: []
     *     - SignatureMessage: []
     *     - Signature: []
     */
    route.get(
        '/presigned/:query?',
        authenticateToken,
        verifySignature,
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
     *     - BearerToken: []
     *     - SignatureMessage: []
     *     - Signature: []
     */
    route.post('/docs', authenticateToken, verifySignature, postDocsValidator, controller.postDocs);

    /**
     * @swagger
     *
     * /microcredit/applications:
     *   put:
     *     tags:
     *       - "microcredit"
     *     summary: "Update microcredit applications"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: array
     *             items:
     *               type: object
     *               properties:
     *                 applicationId:
     *                   type: number
     *                   example: 523
     *                 status:
     *                   type: number
     *                   example: 1
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     *     - SignatureMessage: []
     *     - Signature: []
     */
    route.put(
        '/applications',
        authenticateToken,
        verifySignature,
        onlyAuthorizedRoles(['loanManager']),
        putApplicationsValidator,
        controller.updateApplication
    );

    /**
     * @swagger
     *
     * /microcredit/form:
     *   post:
     *     tags:
     *       - "microcredit"
     *     summary: "Save MicroCredit Form"
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              form:
     *                type: object
     *                required: true
     *              submit:
     *                type: boolean
     *                required: false
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.post('/form', authenticateToken, saveForm, controller.saveForm);
};
