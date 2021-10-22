import { Router } from 'express';

import claimLocation from './claimLocation';
import community from './community';
import exchange from './exchangeRates';
import generic from './generic';
import global from './global';
import media from './media';
import mobile from './mobile';
import story from './story';
import user from './user';

export default (): Router => {
    const app = Router();
    community(app);
    user(app);
    claimLocation(app);
    exchange(app);
    global(app);
    mobile(app);
    story(app);
    media(app);
    generic(app);

    /**
     * @deprecated use /time
     */
    app.get('/clock', (req, res) => res.json(new Date().getTime()));

    return app;
};
