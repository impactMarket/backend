import { Router } from 'express';

import storiesController from '@controllers/stories';
import storiesValidators from '@validators/stories';
import { authenticateToken } from 'api/middlewares';

export default (app: Router): void => {
    const route = Router();
    app.use('/stories', route);

    route.post('/add', storiesValidators.add, storiesController.add);
    route.post('/has', authenticateToken, storiesController.has);
    route.get('/get/:order?', storiesController.getByOrder);
    route.post('/love', storiesValidators.love, storiesController.love);
};
