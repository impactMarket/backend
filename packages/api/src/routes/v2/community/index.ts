import { Router } from 'express';

import state from './state';

export default (app: Router): void => {
    const route = Router();

    app.use('/community', route);

    state(route);
};
