import { Router } from 'express';

import claimLocation from './claimLocation';
import community from './community';
import exchange from './exchangeRates';
import experimental from './experimental';
import globalStatus from './globalStatus';
import mobile from './mobile';
import mobileLogs from './mobileLogs';
import s3 from './s3';
import transactions from './transactions';
import user from './user';

export default (): Router => {
    const app = Router();
    community(app);
    transactions(app);
    user(app);
    s3(app);
    claimLocation(app);
    exchange(app);
    experimental(app);
    globalStatus(app);
    mobileLogs(app);
    mobile(app);

    return app;
};
