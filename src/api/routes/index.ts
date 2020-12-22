import { Router } from 'express';

import claimLocation from './claimLocation';
import community from './community';
import exchange from './exchangeRates';
import globalStatus from './globalStatus';
import mobile from './mobile';
import s3 from './s3';
import storage from './storage';
import user from './user';

export default (): Router => {
    const app = Router();
    community(app);
    user(app);
    s3(app);
    claimLocation(app);
    exchange(app);
    globalStatus(app);
    mobile(app);
    storage(app);

    return app;
};
