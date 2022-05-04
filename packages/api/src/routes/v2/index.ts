import { Router } from 'express';

import claimLocation from './claimLocation';
import community from './community';
import generic from './generic';
import story from './story';
import user from './user';

export default (): Router => {
    const app = Router();
    community(app);
    user(app);
    generic(app);
    story(app);
    claimLocation(app);

    return app;
};
