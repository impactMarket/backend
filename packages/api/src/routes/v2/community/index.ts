import { Router } from 'express';

import details from './details';

export default (app: Router): void => {
    const route = Router();

    app.use('/community', route);

    details(route);
};
