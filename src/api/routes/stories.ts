import { Router } from 'express';

import storiesController from '@controllers/stories';
import storiesValidators from '@validators/stories';

export default (app: Router): void => {
    const route = Router();
    app.use('/stories', route);

    route.post('/add', storiesValidators.add, storiesController.add);
    route.get('/get/:order?', storiesController.getByOrder);
    route.post('/love', storiesValidators.love, storiesController.love);
};
