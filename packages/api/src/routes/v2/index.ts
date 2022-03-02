import { Router } from 'express';

import community from './community';
import user from './user';

export default (): Router => {
    const app = Router();
    community(app);
    user(app);

    return app;
};
