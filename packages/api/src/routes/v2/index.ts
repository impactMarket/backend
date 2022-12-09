import { Router } from 'express';

import claimLocation from './claimLocation';
import community from './community';
import generic from './generic';
import learnAndEarn from './learnAndEarn';
import story from './story';
import user from './user';
import global from './global';

export default (): Router => {
    const app = Router();
    community(app);
    user(app);
    generic(app);
    story(app);
    claimLocation(app);
    learnAndEarn(app);
    global(app);

    return app;
};
