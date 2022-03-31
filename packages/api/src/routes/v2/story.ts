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
     *         description: media mimetype
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
     *               storyMediaPath:
     *                 type: string
     *                 nullable: true
     *                 description: The media path of the story from presigned url
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
     */
    route.get('/:query?', optionalAuthentication, storyController.list);
};
