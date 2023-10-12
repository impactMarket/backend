import { Router } from 'express';

import { LazyAgendaController } from '../../controllers/v2/lazyAgenda';
import { addUserLazyAgendaItemValidator } from '../../validators/lazyAgenda';
import { authenticateToken } from '../../middlewares';

export default (app: Router): void => {
    const controller = new LazyAgendaController();
    const route = Router();
    app.use('/lazy-agenda', route);

    /**
     * @swagger
     *
     * /lazy-agenda:
     *   get:
     *     tags:
     *     - "lazy-agenda"
     *     summary: "Get all lazy agenda items for the user doing the request"
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.get('/', authenticateToken, controller.get);

    /**
     * @swagger
     *
     * /lazy-agenda:
     *   post:
     *     tags:
     *     - "lazy-agenda"
     *     summary: "Register a lazy agenda item"
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              type:
     *                type: number
     *                required: true
     *                example: 0
     *              details:
     *                type: object
     *                required: false
     *                example: { "amount": 5 }
     *              frequency:
     *                type: number
     *                required: true
     *                example: 2592000
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.post('/', authenticateToken, addUserLazyAgendaItemValidator, controller.add);

    /**
     * @swagger
     *
     * /lazy-agenda/{id}:
     *   delete:
     *     tags:
     *     - "lazy-agenda"
     *     summary: "Delete a lazy agenda item"
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Lazy agenda item id to remove
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.delete('/:id', authenticateToken, controller.delete);
};
