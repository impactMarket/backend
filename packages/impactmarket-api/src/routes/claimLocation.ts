import claimLocationController from '../controllers/claimLocation';
import claimLocationValidators from '../validators/claimLocation';
import { Router } from 'express';

import { database } from '@impactmarket/core';
import { authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const route = Router();
    app.use('/claim-location', route);

    route.get('/', database.cacheWithRedis('1 day'), claimLocationController.getAll);

    route.post(
        '/',
        authenticateToken,
        claimLocationValidators.add,
        claimLocationController.add
    );
};
