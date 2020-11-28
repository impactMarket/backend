import { Router } from 'express';

import ExperimentalService from '../services/experimental';

const route = Router();

export default (app: Router): void => {
    app.use('/experimental', route);

    route.get('/', (req, res) => {
        res.send(ExperimentalService.get());
    });
};
