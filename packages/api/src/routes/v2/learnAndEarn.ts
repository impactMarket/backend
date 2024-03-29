import { Router } from 'express';

import {
    answer,
    createLevel,
    listLessonsValidator,
    listLevels,
    registerClaimRewards,
    startLesson
} from '../../validators/learnAndEarn';
import { authenticateToken, optionalAuthentication } from '../../middlewares';
import { cache } from '../../middlewares/cache-redis';
import { cacheIntervals } from '../../utils/api';
import LearnAndEarnController from '../../controllers/v2/learnAndEarn';

export default (app: Router): void => {
    const learnAndEarnController = new LearnAndEarnController();
    const route = Router();
    app.use('/learn-and-earn', route);

    /**
     * @swagger
     *
     * /learn-and-earn/levels:
     *   get:
     *     tags:
     *       - "learn-and-earn"
     *     summary: "List levels"
     *     parameters:
     *       - in: header
     *         name: client-id
     *         schema:
     *           type: integer
     *         required: false
     *         description: optional client id
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for pagination
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [available, started, completed]
     *         required: false
     *         description: Lesson status
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *         required: false
     *         description: Lesson category (Prismic ID)
     *       - in: query
     *         name: language
     *         schema:
     *           type: string
     *         required: false
     *         description: Levels language
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.get(
        '/levels',
        optionalAuthentication,
        cache(cacheIntervals.halfHour, true),
        listLevels,
        learnAndEarnController.listLevels
    );

    /**
     * @swagger
     *
     * /learn-and-earn/levels/admin:
     *   get:
     *     tags:
     *       - "learn-and-earn"
     *     summary: "List admin levels"
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.get('/levels/admin', authenticateToken, learnAndEarnController.listLevelsByAdmin);

    /**
     * @swagger
     *
     * /learn-and-earn/levels:
     *   post:
     *     tags:
     *       - "learn-and-earn"
     *     summary: "Create level"
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.post('/levels', authenticateToken, createLevel, learnAndEarnController.createLevel);

    route.put('/levels', authenticateToken, registerClaimRewards, learnAndEarnController.registerClaimRewards);

    /**
     * @swagger
     *
     * /learn-and-earn/levels/{id}:
     *   get:
     *     tags:
     *       - "learn-and-earn"
     *     summary: "List lessons on a level"
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: number
     *         required: true
     *         description: level id
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.get(
        '/levels/:id',
        optionalAuthentication,
        cache(cacheIntervals.halfHour, true),
        listLessonsValidator,
        learnAndEarnController.listLessons
    );

    /**
     * @swagger
     *
     * /learn-and-earn/lessons:
     *   put:
     *     tags:
     *       - "learn-and-earn"
     *     summary: "Verify answers"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               lesson:
     *                 type: string
     *               answers:
     *                 type: array
     *                 items:
     *                   type: number
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.put('/lessons', authenticateToken, answer, learnAndEarnController.answer);

    /**
     * @swagger
     *
     * /learn-and-earn/lessons:
     *   post:
     *     tags:
     *       - "learn-and-earn"
     *     summary: "Start a lesson"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               lesson:
     *                 type: string
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.post('/lessons', authenticateToken, startLesson, learnAndEarnController.startLesson);

    /**
     * trigger update
     */
    route.post('/webhook', authenticateToken, learnAndEarnController.webhook);

    /**
     * @swagger
     *
     * /learn-and-earn/:
     *   get:
     *     tags:
     *       - "learn-and-earn"
     *     summary: "Get user metrics"
     *     parameters:
     *       - in: header
     *         name: client-id
     *         schema:
     *           type: integer
     *         required: false
     *         description: optional client id
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.get('/', authenticateToken, cache(cacheIntervals.halfHour, true), learnAndEarnController.total);
};
