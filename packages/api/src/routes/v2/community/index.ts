import { Router } from 'express';

import details from './details';
import edit from './edit';
import list from './list';

export default (app: Router): void => {
    const route = Router();

    app.use('/communities', route);

    details(route);
    list(route);
    edit(route);
};
