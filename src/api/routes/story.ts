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

    route.post(
        '/add',
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
     * /story/remove:
     *   post:
     *     tags:
     *       - "story"
     *     produces:
     *       - application/json
     */
    route.post(
        '/remove',
        authenticateToken,
        storyValidator.remove,
        storyController.remove
    );
    /**
     * @swagger
     *
     * /api/story/me:
     *   get:
     *     tags:
     *     - "story"
     *     produces:
     *       - application/json
     *     responses:
     *       "200":
     *         description: "Success"
     *     security:
     *     - api_auth:
     *       - "read:user":
     */
    route.get('/me', authenticateToken, storyController.listUserOnly);
    route.get('/list/:order?', storyController.listByOrder);
    route.get(
        '/community/:id/:order?',
        (req, res, next) => {
            (req as any).authTokenIsOptional = true;
            next();
        },
        authenticateToken,
        storyController.getByCommunity
    );
    route.post(
        '/love',
        authenticateToken,
        storyValidator.love,
        storyController.love
    );
};
