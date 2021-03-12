import { Router } from 'express';
import multer from 'multer';

import StoryController from '@controllers/story';
import StoryValidator from '@validators/story';
import { authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const storyController = new StoryController();
    const storyValidator = new StoryValidator();
    const route = Router();
    const storage = multer.memoryStorage();
    const upload = multer({ storage });
    app.use('/story', route);

    /**
     * @swagger
     *
     * /story:
     *   post:
     *     tags:
     *       - "story"
     *     summary: Add a new story
     *     requestBody:
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               imageFile:
     *                 type: string
     *                 format: binary
     *               communityId:
     *                 type: integer
     *               message:
     *                 type: string
     *     responses:
     *       "200":
     *         description: "Success"
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post(
        '/',
        (req, res, next) => {
            // media is optional, so if there's no file, move on
            upload.single('imageFile')(req, res, () => {
                next();
            });
        },
        storyValidator.add,
        storyController.add
    );
    route.post('/has', authenticateToken, storyController.has);
    /**
     * @swagger
     *
     * /story/{id}:
     *   delete:
     *     tags:
     *       - "story"
     *     summary: Delete a story
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Story id to remove
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.delete('/:id', authenticateToken, storyController.remove);
    /**
     * @swagger
     *
     * /story/me:
     *   get:
     *     tags:
     *       - "story"
     *     summary: List user stories
     *     produces:
     *       - application/json
     *     responses:
     *       "200":
     *         description: "Success"
     *     security:
     *     - api_auth:
     *       - "read:read":
     */
    route.get('/me', authenticateToken, storyController.listUserOnly);
    /**
     * @swagger
     *
     * /story/list/{order}:
     *   get:
     *     tags:
     *       - "story"
     *     summary: List all communities (with at least one story) with the most recent story
     *     parameters:
     *       - in: path
     *         name: order
     *         schema:
     *           type: string
     *         required: false
     *         description: Stories' order (no functionality yet)
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/list/:order?', storyController.listByOrder);
    /**
     * @swagger
     *
     * /story/community/{id}/{order}:
     *   get:
     *     tags:
     *       - "story"
     *     summary: List all stories from a community
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Community id to fetch stories from
     *       - in: path
     *         name: order
     *         schema:
     *           type: string
     *         required: false
     *         description: Stories' order (no functionality yet)
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get(
        '/community/:id/:order?',
        (req, res, next) => {
            (req as any).authTokenIsOptional = true;
            next();
        },
        authenticateToken,
        storyController.getByCommunity
    );
    /**
     * @swagger
     *
     * /story/love/{id}:
     *   put:
     *     tags:
     *       - "story"
     *     summary: Love a story
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Story id to love
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.put('/love/:id', authenticateToken, storyController.love);
};
