import { Router } from 'express';

import StoryController from '../../controllers/v2/story';
import { authenticateToken, optionalAuthentication } from '../../middlewares';
import StoryValidator from '../../validators/story';

export default (app: Router): void => {
    const storyController = new StoryController();
    const storyValidator = new StoryValidator();
    const route = Router();
    app.use('/stories', route);

    /**
     * @swagger
     *
     * /stories/presigned:
     *   get:
     *     tags:
     *       - "stories"
     *     summary: "Get AWS presigned URL to upload media content"
     *     parameters:
     *       - in: query
     *         name: mime
     *         schema:
     *           type: string
     *         required: true
     *         description: media mimetype, separated by semicolon (png;jpg).
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/presigned/:query?',
        authenticateToken,
        storyController.getPresignedUrlMedia
    );

    /**
     * @swagger
     *
     * /stories:
     *   post:
     *     tags:
     *       - "stories"
     *     summary: Add a new story
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               communityId:
     *                 type: integer
     *                 description: The community id
     *               storyMedia:
     *                 type: array
     *                 items:
     *                   type: string
     *               message:
     *                 type: string
     *                 nullable: true
     *                 description: Story message
     *     responses:
     *       "200":
     *         description: "Success"
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post('/', authenticateToken, storyValidator.add, storyController.add);

    /**
     * @swagger
     *
     * /stories/{id}:
     *   delete:
     *     tags:
     *       - "stories"
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
     * /stories/count:
     *   get:
     *     tags:
     *       - "stories"
     *     summary: Count grouped stories
     *     parameters:
     *       - in: query
     *         name: groupBy
     *         schema:
     *           type: string
     *           enum: [country]
     *         required: true
     *         description: count stories by a grouped value
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/count/:query?', storyController.count);

    /**
     * @swagger
     *
     * /stories/{id}:
     *   get:
     *     tags:
     *       - "stories"
     *     summary: Get a story by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Story id
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get('/:id', optionalAuthentication, storyController.getById);

    /**
     * @swagger
     *
     * /stories:
     *   get:
     *     tags:
     *       - "stories"
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
     *       - in: query
     *         name: user
     *         schema:
     *           type: string
     *         required: false
     *         description: user address to filter stories
     *       - in: query
     *         name: communityId
     *         schema:
     *           type: array
     *           items:
     *            type: integer
     *         required: false
     *         description: communitiesId used to filter the stories
     *       - in: query
     *         name: country
     *         schema:
     *           type: array
     *           items:
     *            type: string
     *         required: false
     *         description: countries used to filter the stories
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get('/:query?', optionalAuthentication, storyController.list);

    /**
     * @swagger
     *
     * /stories/love/{id}:
     *   put:
     *     tags:
     *       - "stories"
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
     * /stories/inapropriate/{id}:
     *   put:
     *     tags:
     *       - "stories"
     *     summary: Mark if consider story inapropriate
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Story id to report
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               typeId:
     *                 type: integer
     *                 description: type ID that describe why the story is inapropriate
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
