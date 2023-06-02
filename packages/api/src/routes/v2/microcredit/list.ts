import { Router } from 'express';

import { MicroCreditController } from '../../../controllers/v2/microcredit/list';
import {
    listBorrowersValidator,
    queryGetBorrowerValidator,
    repaymentsHistoryValidator
} from '../../../validators/microcredit';
import { authenticateToken, onlyAuthorizedRoles, verifySignature } from '../../../middlewares';
import { cache } from '../../../middlewares/cache-redis';
import { cacheIntervals } from '../../../utils/api';

export default (route: Router): void => {
    const controller = new MicroCreditController();

    /**
     * @swagger
     *
     * /microcredit/borrowers:
     *   get:
     *     tags:
     *       - "microcredit"
     *     summary: "Get List of Borrowers by manager"
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
     *         name: claimed
     *         schema:
     *           type: boolean
     *         required: false
     *         description: filter by claimed loans (using true) or not claimed (using false) or both with undefined
     *       - in: query
     *         name: filter
     *         schema:
     *           type: string
     *           enum: [repaid, needHelp]
     *         required: false
     *         description: optional filter
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *           enum: [amount, period, lastRepayment, lastDebt]
     *         required: false
     *         description: order by
     *       - in: query
     *         name: orderDirection
     *         schema:
     *           type: string
     *           enum: [desc, asc]
     *         required: false
     *         description: order direction
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
        cache(cacheIntervals.fiveMinutes),
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
     *         required: true
     *         description: borrower address
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
        onlyAuthorizedRoles(['loanManager']),
        queryGetBorrowerValidator,
        cache(cacheIntervals.fiveMinutes),
        controller.getBorrower
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
     *         name: loanId
     *         schema:
     *           type: integer
     *         required: true
     *         description: loan id of the user
     *       - in: query
     *         name: borrower
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
        onlyAuthorizedRoles(['loanManager']),
        repaymentsHistoryValidator,
        cache(cacheIntervals.fiveMinutes),
        controller.getRepaymentsHistory
    );
};
