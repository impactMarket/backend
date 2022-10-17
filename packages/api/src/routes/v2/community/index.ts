import { Router } from 'express';

import create from './create';
import details from './details';
import list from './list';

export default (app: Router): void => {
    const route = Router();

    app.use('/communities', route);

    details(route);
    list(route);
    create(route);
};
