import { Router } from 'express';

import create from './create';
import list from './list';

export default (app: Router): void => {
    const route = Router();

    app.use('/microcredit', route);

    list(route);
    create(route);
};
