import globalController from '@controllers/global';
import { Router } from 'express';

import { cacheWithRedis } from '../../database';

export default (app: Router): void => {
    const route = Router();
    app.use('/global', route);

    route.get(
        '/status',
        // cacheWithRedis('1 hour'),
        globalController.globalStatus
    );

    route.get('/numbers', cacheWithRedis('1 hour'), globalController.numbers);

    route.get(
        '/demographics',
        cacheWithRedis('1 hour'),
        globalController.globalDemographics
    );
};
