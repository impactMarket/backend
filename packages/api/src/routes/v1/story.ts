import { Router } from 'express';

import StoryController from '../../controllers/v1/story';
import { authenticateToken, optionalAuthentication } from '../../middlewares';
import StoryValidator from '../../validators/story';

export default (app: Router): void => {
    const storyController = new StoryController();
    const storyValidator = new StoryValidator();
    const route = Router();
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
     *                 description: The community id
     *               mediaId:
     *                 type: integer
     *                 nullable: true
     *                 description: Id of the media in media registry (currently support only image)
     *               message:
     *                 type: string
     *                 nullable: true
     *                 description: Story message
     *     responses:
     *       "200":
     *         description: "Success"
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ICommunityStory'
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post('/', authenticateToken, storyValidator.add, storyController.add);

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
     * /story/media/{mime}:
     *   get:
     *     tags:
     *       - "story"
     *     summary: Make a request for a presigned URL
     *     parameters:
     *       - in: path
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
        '/media/:mime',
        authenticateToken,
        storyController.getPresignedUrlMedia
    );

    route.post('/has', authenticateToken, storyController.has);

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
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   $ref: '#/components/schemas/ICommunityStories'
     *                 count:
     *                   type: integer
     *     security:
     *     - api_auth:
     *       - "read:read":
     */
    route.get('/me/:query?', authenticateToken, storyController.getByUser);

    /**
     * @swagger
     *
     * /story/list:
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
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/ICommunitiesListStories'
     *                 count:
     *                   type: integer
     */
    route.get('/list/:query?', storyController.listByOrder);

    /**
     * @swagger
     *
     * /story/community/{id}:
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
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   $ref: '#/components/schemas/ICommunityStories'
     *                 count:
     *                   type: integer
     */
    route.get(
        '/community/:id/:query?',
        optionalAuthentication,
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
