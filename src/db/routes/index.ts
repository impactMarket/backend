import { Router } from 'express';
import community from './community';
import transactions from './transactions';
import beneficiary from './beneficiary';
import user from './user';
import s3 from './s3';


export default () => {
    const app = Router();
    community(app);
    transactions(app);
    beneficiary(app);
    user(app);
    s3(app);

    return app;
}