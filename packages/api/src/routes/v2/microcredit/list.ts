import { Router } from 'express';

import { MicroCreditController } from '../../../controllers/v2/microcredit/list';
import { listBorrowersValidator, repaymentsHistoryValidator } from '../../../validators/microcredit';
import { authenticateToken } from '../../../middlewares';
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
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/borrowers/:query?',
        authenticateToken,
        listBorrowersValidator,
        cache(cacheIntervals.fiveMinutes),
        controller.listBorrowers
    );

    /**
     * @swagger
     *
     * /microcredit/repayment-history:
     *   get:
     *     tags:
     *       - "microcredit"
     *     summary: "Get repayments history of a user"
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
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/repayment-history/:query?',
        authenticateToken,
        repaymentsHistoryValidator,
        cache(cacheIntervals.fiveMinutes),
        controller.getRepaymentsHistory
    );
};
