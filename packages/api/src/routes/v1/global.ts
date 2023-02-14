import { Router } from 'express';

import globalController from '../../controllers/v1/global';

export default (app: Router): void => {
    const route = Router();
    app.use('/global', route);

    route.get('/status', globalController.globalStatus);

    route.get('/numbers', globalController.numbers);

    route.get('/demographics', globalController.globalDemographics);
};
