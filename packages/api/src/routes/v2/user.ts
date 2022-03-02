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
     *     summary: "Create user"
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
     *                 description: phone number
     *                 required: false
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
     *     summary: "Get user"
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get('/', authenticateToken, userController.get);

    /**
     * @swagger
     *
     * /user:
     *   put:
     *     tags:
     *     - "user"
     *     summary: "Update user"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               language:
     *                 type: string
     *                 required: false
     *               currency:
     *                 type: string
     *                 required: false
     *               pushNotificationToken:
     *                 type: string
     *                 nullable: true
     *                 required: false
     *               username:
     *                 type: string
     *                 nullable: true
     *                 required: false
     *               gender:
     *                 type: string
     *                 enum: [u, m, f, o]
     *                 required: false
     *               year:
     *                 type: number
     *                 nullable: true
     *                 required: false
     *               children:
     *                 type: number
     *                 nullable: true
     *                 required: false
     *               avatarMediaId:
     *                 type: number
     *                 required: false
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.put(
        '/',
        authenticateToken,
        userValidators.update,
        userController.update
    );

    /**
     * @swagger
     *
     * /user:
     *   delete:
     *     tags:
     *     - "user"
     *     summary: "Delete user"
     *     responses:
     *       "200":
     *         description: "Success"
     *       "403":
     *         description: "Invalid input"
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.delete('/', authenticateToken, userController.delete);
};
