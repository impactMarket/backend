import StoryController from '@controllers/story';
import StoryValidator from '@validators/story';
import { Router } from 'express';
import multer from 'multer';

import { cacheWithRedis } from '../../database';
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
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               communityId:
     *                 type: integer
     *               message:
     *                 type: string
     *               mediaUrl:
     *                 type: string
     *                 required: false
     *     responses:
     *       "200":
     *         description: "Success"
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/IAddStory'
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post('/', authenticateToken, storyValidator.add, storyController.add);

    /**
     * @swagger
     *
     * /story/picture:
     *   post:
     *     tags:
     *       - "story"
     *     summary: Add a new picture to the story bucket
     *     requestBody:
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               imageFile:
     *                 type: string
     *                 format: binary
     *     responses:
     *       "200":
     *         description: "Success"
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post(
        '/picture',
        authenticateToken,
        upload.single('imageFile'),
        storyController.pictureAdd
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
     *     summary: List user stories only
     *     parameters:
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for user's stories pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for user's stories pagination
     *     responses:
     *       "200":
     *         description: "Success"
     *     security:
     *     - api_auth:
     *       - "read:read":
     */
    route.get('/me/:query?', authenticateToken, storyController.getByUser);

    /**
     * @swagger
     *
     * /story/list/{order}:
     *   get:
     *     tags:
     *       - "story"
     *     summary: List all communities (with at least one story) with the most recent story
     *     parameters:
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for stories pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for stories pagination
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get(
        '/list/:query?',
        cacheWithRedis('1 hour'),
        storyController.listByOrder
    );

    /**
     * @swagger
     *
     * /story/community/{id}/{query}:
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
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for stories pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for stories pagination
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get(
        '/community/:id/:query?',
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

    /**
     * @swagger
     *
     * /story/inapropriate/{id}:
     *   put:
     *     tags:
     *       - "story"
     *     summary: Mark if consider story inapropriate
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Story id to report
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.put(
        '/inapropriate/:id',
        authenticateToken,
        storyController.inapropriate
    );
};
