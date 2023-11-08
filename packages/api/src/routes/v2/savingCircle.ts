import { Router } from 'express';

import { authenticateToken } from '../../middlewares';
import SavingCircleController from '../../controllers/v2/savingCircle';
import SavingCircleValidator from '../../validators/savingCircle';

export default (app: Router): void => {
    const savingCircleController = new SavingCircleController();
    const savingCircleValidator = new SavingCircleValidator();
    const route = Router();
    app.use('/saving-circles', route);

    /**
     * @swagger
     *
     * /saving-circles:
     *   post:
     *     tags:
     *       - "saving-circles"
     *     summary: Create saving circle
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 description: Group name
     *               members:
     *                 description: Member addresses
     *                 type: array
     *                 items:
     *                   type: string
     *               country:
     *                 type: string
     *                 description: Group country (2 digits)
     *               amount:
     *                 type: number
     *                 description: Saving amount
     *               frequency:
     *                 type: number
     *                 description: Saving frequency (seconds)
     *               firstDepositOn:
     *                 type: number
     *                 description: First deposit on (timestamp)
     *     responses:
     *       "200":
     *         description: "Success"
     *     security:
     *     - BearerToken: []
     */
    route.post('/', authenticateToken, savingCircleValidator.create, savingCircleController.create);

    /**
     * @swagger
     *
     * /saving-circles/{id}/invites:
     *   put:
     *     tags:
     *       - "saving-circles"
     *     summary: Invite response
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               decision:
     *                 type: string
     *                 description: Group name
     *                 enum: [declined, accepted]
     *                 required: true
     *     responses:
     *       "200":
     *         description: "Success"
     *     security:
     *     - BearerToken: []
     */
    route.put('/:id/invites', authenticateToken, savingCircleValidator.invite, savingCircleController.invite);
};
