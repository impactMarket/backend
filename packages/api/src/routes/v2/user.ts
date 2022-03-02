import { Router } from 'express';

import UserController from '../../controllers/v2/user';
import { authenticateToken } from '../../middlewares';
import userValidators from '../../validators/user';

export default (app: Router): void => {
    const route = Router();
    const userController = new UserController();

    app.use('/user', route);

    /**
     * @swagger
     *
     * /user:
     *   post:
     *     tags:
     *     - "user"
     *     summary: "Authenticate user"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               address:
     *                 type: string
     *                 required: true
     *               phone:
     *                 type: string
     *                 description: phone number (hashed once it reaches the backend)
     *                 required: true
     *               language:
     *                 type: string
     *                 required: false
     *               currency:
     *                 type: string
     *                 required: false
     *               pushNotificationToken:
     *                 type: string
     *                 required: false
     *               username:
     *                 type: string
     *                 required: false
     *               gender:
     *                 type: string
     *                 enum: [u, m, f, o]
     *                 required: false
     *               year:
     *                 type: number
     *                 required: false
     *               children:
     *                 type: number
     *                 required: false
     *               avatarMediaId:
     *                 type: number
     *                 required: false
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     */
    route.post('/', userValidators.create, userController.create);

    /**
     * @swagger
     *
     * /user:
     *   get:
     *     tags:
     *     - "user"
     *     summary: "Log user"
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     */
    route.get('/', authenticateToken, userController.get);
};
