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
     */
    route.get('/', controller.get);

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
     *              details:
     *                type: object
     *                required: false
     *              frequency:
     *                type: number
     *                required: true
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - BearerToken: []
     */
    route.post('/', authenticateToken, addUserLazyAgendaItemValidator, controller.add);
};
