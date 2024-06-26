import { Router } from 'express';

import { add, addComment, getStoryCommentsValidator, getStoryValidator } from '../../validators/story';
import { authenticateToken, optionalAuthentication } from '../../middlewares';
import { cache } from '../../middlewares/cache-redis';
import { cacheIntervals } from '../../utils/api';
import StoryController from '../../controllers/v2/story';

export default (app: Router): void => {
    const storyController = new StoryController();
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
     *           type: array
     *           items:
     *            type: string
     *         required: true
     *         description: media mimetype
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.get('/presigned/:query?', authenticateToken, storyController.getPresignedUrlMedia);

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
     *     - BearerToken: []
     */
    route.post('/', authenticateToken, add, storyController.add);

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
     *     - BearerToken: []
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
    route.get('/count/:query?', cache(cacheIntervals.oneHour), storyController.count);

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
     *     - BearerToken: []
     */
    route.get('/:id', optionalAuthentication, getStoryValidator, storyController.getById);

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
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *         required: false
     *         description: field to order and the order direction (mostLoved:desc)
     *       - in: query
     *         name: period
     *         schema:
     *           type: number
     *         required: false
     *         description: last days
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.get('/:query?', optionalAuthentication, cache(cacheIntervals.fiveMinutes), storyController.list);

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
     *     - BearerToken: []
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
     *     - BearerToken: []
     */
    route.put('/inapropriate/:id', authenticateToken, storyController.inapropriate);

    /**
     * @swagger
     *
     * /stories/{id}/comments:
     *   get:
     *     tags:
     *       - "stories"
     *     summary: Get the story comments
     *     parameters:
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for comments pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for comments pagination
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
     *     - BearerToken: []
     */
    route.get('/:id/comments/:query?', getStoryCommentsValidator, storyController.getComments);

    /**
     * @swagger
     *
     * /stories/{id}/comments:
     *   post:
     *     tags:
     *       - "stories"
     *     summary: Post a new story comment
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Story id
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               comment:
     *                 type: string
     *                 description: Story comment
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.post('/:id/comments', authenticateToken, addComment, storyController.addComment);

    /**
     * @swagger
     *
     * /stories/{id}/comments/{commentId}:
     *   delete:
     *     tags:
     *       - "stories"
     *     summary: Delete a story comment
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Story id
     *       - in: path
     *         name: commentId
     *         schema:
     *           type: integer
     *         required: true
     *         description: Story comment id
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.delete('/:id/comments/:commentId', authenticateToken, storyController.removeComment);
};
