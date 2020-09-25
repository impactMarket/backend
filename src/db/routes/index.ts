import { Router } from 'express';
import community from './community';
import transactions from './transactions';
import user from './user';
import s3 from './s3';
import claimLocation from './claimLocation';
import exchange from './exchangeRates';
import experimental from './experimental';
import globalStatus from './globalStatus';


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

    return app;
}