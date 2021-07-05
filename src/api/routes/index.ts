import { Router } from 'express';

import claimLocation from './claimLocation';
import community from './community';
import exchange from './exchangeRates';
import global from './global';
import media from './media';
import mobile from './mobile';
import storage from './storage';
import story from './story';
import system from './system';
import user from './user';

export default (): Router => {
    const app = Router();
    community(app);
    user(app);
    claimLocation(app);
    exchange(app);
    global(app);
    mobile(app);
    storage(app);
    system(app);
    story(app);
    media(app);

    return app;
};
