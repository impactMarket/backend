import { Router } from 'express';

import community from './community';
import generic from './generic';
import user from './user';

export default (): Router => {
    const app = Router();
    community(app);
    user(app);
    generic(app);

    return app;
};
