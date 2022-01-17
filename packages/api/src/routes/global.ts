import { database } from '@impactmarket/core';
import { Router } from 'express';

import globalController from '../controllers/global';

export default (app: Router): void => {
    const route = Router();
    app.use('/global', route);

    route.get(
        '/status',
        database.cacheWithRedis('1 hour'),
        globalController.globalStatus
    );

    route.get(
        '/numbers',
        database.cacheWithRedis('1 hour'),
        globalController.numbers
    );

    route.get(
        '/demographics',
        database.cacheWithRedis('1 hour'),
        globalController.globalDemographics
    );
};
