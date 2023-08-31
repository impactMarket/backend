import { Router } from 'express';

import { MicroCreditController } from '../../../controllers/v2/microcredit/list';
import { authenticateToken, onlyAuthorizedRoles, verifySignature } from '../../../middlewares';
import { cache } from '../../../middlewares/cache-redis';
import { cacheIntervals } from '../../../utils/api';
import {
    listApplicationsValidator,
    listBorrowersValidator,
    queryGetBorrowerValidator,
    repaymentsHistoryValidator
} from '../../../validators/microcredit';

export default (route: Router): void => {
    const controller = new MicroCreditController();

    /**
     * @swagger
     *
     * /microcredit/borrowers:
     *   get:
     *     tags:
     *       - "microcredit"
     *     summary: "Get list of borrowers by manager"
     *     parameters:
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for pagination
     *       - in: query
     *         name: filter
     *         schema:
     *           type: string
     *           enum: [not-claimed, ontrack, need-help, repaid]
     *         required: false
     *         description: optional filter (leave it undefined to get all)
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *           enum: [amount, amount:asc, amount:desc, period, period:asc, period:desc, lastRepayment, lastRepayment:asc, lastRepayment:desc, lastDebt, lastDebt:asc, lastDebt:desc, performance, performance:asc, performance:desc]
     *         required: false
     *         description: order by
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     *     - SignatureMessage: []
     *     - Signature: []
     */
    route.get(
        '/borrowers/:query?',
        authenticateToken,
        verifySignature,
        onlyAuthorizedRoles(['loanManager']),
        listBorrowersValidator,
        controller.listBorrowers
    );

    /**
     * @swagger
     *
     * /microcredit/borrower:
     *   get:
     *     tags:
     *       - "microcredit"
     *     summary: "Get borrower data by loan manager"
     *     parameters:
     *       - in: query
     *         name: address
     *         schema:
     *           type: string
     *         required: false
     *         description: borrower address (required if formId is undefined)
     *       - in: query
     *         name: formId
     *         schema:
     *           type: number
     *         required: false
     *         description: form ID
     *       - in: query
     *         name: include
     *         schema:
     *           type: array
     *           items:
     *             type: string
     *         required: false
     *         enum: [docs, forms, notes]
     *         example: [docs, forms, notes]
     *         description: what to include in the response
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     *     - SignatureMessage: []
     *     - Signature: []
     */
    route.get(
        '/borrower/:query?',
        authenticateToken,
        verifySignature,
        onlyAuthorizedRoles(['loanManager', 'itself']),
        queryGetBorrowerValidator,
        cache(cacheIntervals.twoMinutes),
        controller.getBorrower
    );

    /**
     * @swagger
     *
     * /microcredit/applications:
     *   get:
     *     tags:
     *       - "microcredit"
     *     summary: "Get list of applications"
     *     parameters:
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for pagination
     *       - in: query
     *         name: status
     *         schema:
     *           type: integer
     *         required: false
     *         description: "Status can be 0: pending, 1: submitted, 2: in-review, 3: requested-changes, 4: interview, 5: approved, 6: rejected"
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *           enum: [appliedOn, appliedOn:asc, appliedOn:desc]
     *         required: false
     *         description: order by
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     *     - SignatureMessage: []
     *     - Signature: []
     */
    route.get(
        '/applications/:query?',
        authenticateToken,
        verifySignature,
        onlyAuthorizedRoles(['loanManager']),
        listApplicationsValidator,
        controller.listApplications
    );

    /**
     * @swagger
     *
     * /microcredit/repayment-history:
     *   get:
     *     tags:
     *       - "microcredit"
     *     summary: "Get repayments history of a user"
     *     description: "Gets repayments history of a user, only accessible to the loan manager"
     *     parameters:
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for pagination
     *       - in: query
     *         name: address
     *         schema:
     *           type: string
     *         required: true
     *         description: borrower address
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/getRepaymentsHistory'
     *     security:
     *     - BearerToken: []
     *     - SignatureMessage: []
     *     - Signature: []
     */
    route.get(
        '/repayment-history/:query?',
        authenticateToken,
        verifySignature,
        onlyAuthorizedRoles(['loanManager', 'itself']),
        repaymentsHistoryValidator,
        cache(cacheIntervals.fiveMinutes),
        controller.getRepaymentsHistory
    );

    /**
     * @swagger
     *
     * /microcredit/demographics:
     *   get:
     *     tags:
     *       - "microcredit"
     *     summary: "Get Microcredit demographics"
     *     description: "Get Microcredit demographics"
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/demographics'
     */
    route.get('/demographics', cache(cacheIntervals.oneHour), controller.demographics);

    /**
     * @swagger
     *
     * /microcredit/form/{id}:
     *   get:
     *     tags:
     *       - "microcredit"
     *     summary: "Get Microcredit form"
     *     description: "Get Microcredit form"
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Form id to get
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/form'
     *     security:
     *     - BearerToken: []
     */
    route.get('/form/:id', authenticateToken, controller.getUserForm);

    /**
     * @swagger
     *
     * /microcredit/managers/{country}:
     *   get:
     *     tags:
     *       - "microcredit"
     *     summary: "Get Microcredit managers by country"
     *     description: "Get Microcredit managers by country"
     *     parameters:
     *       - in: path
     *         name: country
     *         schema:
     *           type: string
     *         required: true
     *         description: country tag (eg.  NG, KE, GH, etc.)
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/managers/:country', controller.getLoanManagersByCountry);
};
