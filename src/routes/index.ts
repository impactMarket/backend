import { Router } from 'express';
import community from './community';
import transactions from './transactions';
import beneficiary from './beneficiary';
import user from './user';


export default () => {
    const app = Router();
    community(app);
    transactions(app);
    beneficiary(app);
    user(app);

    return app;
}