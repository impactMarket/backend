import claimLocationController from '@controllers/claimLocation';
import claimLocationValidators from '@validators/claimLocation';
import { Router } from 'express';

import { cacheWithRedis } from '../../database';
import { authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const route = Router();
    app.use('/claim-location', route);

    route.get('/', cacheWithRedis('1 day'), claimLocationController.getAll);

    route.post(
        '/',
        authenticateToken,
        claimLocationValidators.add,
        claimLocationController.add
    );
};
