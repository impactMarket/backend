import globalController from '@controllers/global';
import { Router } from 'express';

export default (app: Router): void => {
    const route = Router();
    app.use('/global', route);

    route.get('/status', globalController.globalStatus);

    route.get('/numbers', globalController.numbers);

    route.get('/demographics', globalController.globalDemographics);
};
