import { Router } from 'express';

import list from './list';

export default (app: Router): void => {
    const route = Router();

    app.use('/microcredit', route);

    list(route);
};
