import { Router } from 'express';
import timeout from 'connect-timeout';

import { MicroCreditController } from '../../../controllers/v2/microcredit/create';
import {
    addNote,
    postDocsValidator,
    preSignerUrlFromAWSValidator,
    putApplicationsValidator,
    saveForm
} from '../../../validators/microcredit';
import { authenticateToken, onlyAuthorizedRoles, verifySignature } from '../../../middlewares';

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
     *     description: "Status can be 0: pending, 1: submitted, 2: in-review, 3: requested-changes, 4: approved, 5: rejected"
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
     *                required: false
     *              prismicId:
     *                type: string
     *                required: false
     *              selectedLoanManagerId:
     *                type: number
     *                required: false
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

    /**
     * @swagger
     *
     * /microcredit/notes:
     *   post:
     *     tags:
     *       - "microcredit"
     *     summary: "Add a note to a user"
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              userId:
     *                type: number
     *                required: true
     *              note:
     *                type: boolean
     *                required: false
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.post('/notes', authenticateToken, onlyAuthorizedRoles(['loanManager']), addNote, controller.addNote);
};
