import { Router } from 'express';

import LearnAndEarnController from '../../controllers/v2/learnAndEarn';
import { authenticateToken, optionalAuthentication } from '../../middlewares';
import LearnAndEarnValidator from '../../validators/learnAndEarn';

export default (app: Router): void => {
    const learnAndEarnController = new LearnAndEarnController();
    const learnAndEarnValidator = new LearnAndEarnValidator();
    const route = Router();
    app.use('/learn-and-earn', route);

    /**
     * @swagger
     *
     * /learn-and-earn/total:
     *   get:
     *     tags:
     *       - "learn-and-earn"
     *     summary: "Get total metrics"
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get('/total', authenticateToken, learnAndEarnController.total);

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
     *         name: state
     *         schema:
     *           type: string
     *           enum: [available, completed]
     *         required: true
     *         description: Lesson state
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *         required: true
     *         description: Lesson category
     *       - in: query
     *         name: level
     *         schema:
     *           type: string
     *         required: true
     *         description: Lesson level
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get('/levels', authenticateToken, learnAndEarnController.listLevels);

    /**
     * @swagger
     *
     * /learn-and-earn/{level}/lessons:
     *   get:
     *     tags:
     *       - "learn-and-earn"
     *     summary: "List lessons"
     *     parameters:
     *       - in: path
     *         name: level
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
        '/:level/lessons',
        authenticateToken,
        learnAndEarnController.listLessons
    );

    /**
     * @swagger
     *
     * /learn-and-earn/answers:
     *   post:
     *     tags:
     *       - "learn-and-earn"
     *     summary: "Verify answers"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               answers:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     answer:
     *                       type: string
     *                     quiz:
     *                       type: string
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post(
        '/answers',
        authenticateToken,
        learnAndEarnValidator.answer,
        learnAndEarnController.answer
    );

    /**
     * @swagger
     *
     * /learn-and-earn/start:
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
        '/start',
        authenticateToken,
        learnAndEarnValidator.startLesson,
        learnAndEarnController.startLesson
    );
};
