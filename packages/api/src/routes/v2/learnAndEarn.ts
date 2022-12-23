import { Router } from 'express';

import LearnAndEarnController from '../../controllers/v2/learnAndEarn';
import { authenticateToken } from '../../middlewares';
import LearnAndEarnValidator from '../../validators/learnAndEarn';

export default (app: Router): void => {
    const learnAndEarnController = new LearnAndEarnController();
    const learnAndEarnValidator = new LearnAndEarnValidator();
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
     *         name: level
     *         schema:
     *           type: string
     *         required: false
     *         description: Lesson level (Prismic ID)
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/levels',
        authenticateToken,
        learnAndEarnValidator.listLevels,
        learnAndEarnController.listLevels
    );

    route.put(
        '/levels',
        authenticateToken,
        learnAndEarnValidator.registerClaimRewards,
        learnAndEarnController.registerClaimRewards
    );

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
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/levels/:id',
        authenticateToken,
        learnAndEarnController.listLessons
    );

    /**
     * @swagger
     *
     * /learn-and-earn/lessons/{id}:
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
     *     - api_auth:
     *       - "write:modify":
     */
    route.put(
        '/lessons',
        authenticateToken,
        learnAndEarnValidator.answer,
        learnAndEarnController.answer
    );

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
     *     - api_auth:
     *       - "write:modify":
     */
    route.post(
        '/lessons',
        authenticateToken,
        learnAndEarnValidator.startLesson,
        learnAndEarnController.startLesson
    );

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
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get('/', authenticateToken, learnAndEarnController.total);
};
