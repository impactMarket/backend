import { Router } from 'express';

import microcredit from './microcredit';

export default (app: Router): void => {
    const route = Router();
    app.use('/protocol', route);

    microcredit(route);
};
