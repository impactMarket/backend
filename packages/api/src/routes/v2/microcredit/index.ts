import { Router } from 'express';

import list from './list';
import create from './create';

export default (app: Router): void => {
    const route = Router();

    app.use('/microcredit', route);

    list(route);
    create(route);
};
