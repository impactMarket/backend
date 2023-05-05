import { Router } from 'express';

import { MicroCreditController } from '../../../controllers/v2/microcredit/list';
import { listBorrowersValidator } from '../../../validators/microcredit';
import { authenticateToken } from '../../../middlewares';

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
        controller.listBorrowers
    );
};
