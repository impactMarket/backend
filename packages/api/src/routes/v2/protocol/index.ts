import { Router } from 'express';

import microcredit from './microcredit';
import circulatingSupply from './circulatingSupply';

export default (app: Router): void => {
    const route = Router();
    app.use('/protocol', route);

    microcredit(route);
    circulatingSupply(route);

};
