import { Router } from 'express';

import { cache } from '../../middlewares/cache-redis';
import { cacheIntervals } from '../../utils/api';
import globalController from '../../controllers/v2/global';

export default (app: Router): void => {
    const route = Router();
    app.use('/global', route);

    route.get('/status', cache(cacheIntervals.oneHour), globalController.globalStatus);

    route.get('/numbers', cache(cacheIntervals.oneHour), globalController.numbers);

    route.get('/demographics', cache(cacheIntervals.oneHour), globalController.globalDemographics);
};
