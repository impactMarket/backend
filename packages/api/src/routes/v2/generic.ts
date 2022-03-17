import { Router } from 'express';

import GenericController from '../../controllers/v2/generic';

export default (app: Router): void => {
    const genericController = new GenericController();

    /**
     * @swagger
     *
     * /exchange-rates:
     *   get:
     *     tags:
     *       - "generic"
     *     summary: Get exchange rates.
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
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       currency:
     *                         type: string
     *                       rate:
     *                         type: number
     */
    app.get('/exchange-rates', genericController.exchangeRates);
};
