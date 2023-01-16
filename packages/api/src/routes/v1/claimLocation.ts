import { Router } from 'express';

import claimLocationController from '../../controllers/v1/claimLocation';
import { authenticateToken } from '../../middlewares';
import claimLocationValidators from '../../validators/claimLocation';

export default (app: Router): void => {
    const route = Router();
    app.use('/claim-location', route);

    route.get('/', claimLocationController.getAll);

    route.post(
        '/',
        authenticateToken,
        claimLocationValidators.add,
        claimLocationController.add
    );
};
