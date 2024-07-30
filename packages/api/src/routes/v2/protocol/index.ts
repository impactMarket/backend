import { Router } from 'express';

import circulatingSupply from './circulatingSupply';
import microcredit from './microcredit';

export default (app: Router): void => {
    const route = Router();
    app.use('/protocol', route);

    microcredit(route);
    circulatingSupply(route);
};
