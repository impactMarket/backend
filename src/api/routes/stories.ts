import { Router } from 'express';
import multer from 'multer';

import storiesController from '@controllers/stories';
import storiesValidators from '@validators/stories';
import { authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const route = Router();
    const storage = multer.memoryStorage();
    const upload = multer({ storage });
    app.use('/stories', route);

    route.post(
        '/add',
        (req, res, next) => {
            // media is optional, so if there's no file, move on
            upload.single('imageFile')(req, res, () => {
                next();
            });
        },
        storiesValidators.add,
        storiesController.add
    );
    route.post('/has', authenticateToken, storiesController.has);
    route.get('/get/:order?', storiesController.getByOrder);
    route.post('/love', storiesValidators.love, storiesController.love);
};
