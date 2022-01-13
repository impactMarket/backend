import { database } from '@impactmarket/core';
import { Router } from 'express';

import claimLocationController from '../controllers/claimLocation';
import { authenticateToken } from '../middlewares';
import claimLocationValidators from '../validators/claimLocation';

export default (app: Router): void => {
    const route = Router();
    app.use('/claim-location', route);

    route.get(
        '/',
        database.cacheWithRedis('1 day'),
        claimLocationController.getAll
    );

    route.post(
        '/',
        authenticateToken,
        claimLocationValidators.add,
        claimLocationController.add
    );
};
