import { Router } from 'express';

import circulatingSupply from './circulatingSupply';

export default (): Router => {
    const app = Router();
    circulatingSupply(app);

    return app;
};
