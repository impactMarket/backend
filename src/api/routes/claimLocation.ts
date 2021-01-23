import { Router } from 'express';
import claimLocationController from '@controllers/claimLocation';
import claimLocationValidators from '@validators/community';
import { authenticateToken } from '../middlewares';

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
